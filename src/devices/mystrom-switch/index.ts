import Joi from '@hapi/joi';
import wyt from 'wyt';
import type {
  PluginOptions,
  PluginInterface,
} from 'server/plugin-manager';
import * as validationHelpers from 'helpers/validation';
import * as switchAPI from './switch-api';
import * as helpers from './helpers';
import SwitchStates from './switch-states';
import discovery from './discovery';
import {
  SensorType,
  RelayState,
  Availability,
} from './types';
import type {
  SwitchConfig,
  SwitchDetails,
  MyStromSwitchPluginOptions,
} from './types';

function getAvailabilityValue(availability: Availability): 'online' | 'offline' {
  switch (availability) {
    case Availability.Online:
      return 'online';
    case Availability.Offline:
      return 'offline';
    default:
      throw new Error(`Unknown availability '${availability}'`);
  }
}

function getSensorPrecision(sensorType: SensorType): number {
  switch (sensorType) {
    case SensorType.Power:
      return 3;
    default:
      return 2;
  }
}

type SensorBuffer = {
  [mac: string]: {
    [sensorType in SensorType]?: number[];
  };
}

const switchConfigSchema = Joi.object({
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  host: Joi.alternatives(
    Joi.string().ip(),
    Joi.string().hostname(),
  ),
  name: Joi.string().required().min(3).max(32),
});

const optionsSchema = Joi.object({
  mqttTopic: Joi.string().required(),
  pollingInterval: Joi.number().integer().greater(999).required(),
  sensorUpdateInterval: Joi.number().integer().greater(Joi.ref('pollingInterval')).required(),
  switches: Joi.array().items(switchConfigSchema),
});

export default {
  name: 'mystrom-switch',
  version: '1.0.0',
  async initialize(
    plugin: PluginInterface,
    options: PluginOptions = {},
  ): Promise<void> {
    const defaultOptions = {
      pollingInterval: 5000,
      sensorUpdateInterval: 5 * 60000,
      mqttTopic: 'mystrom/wifi_switches',
    };
    const opts = validationHelpers.validate<MyStromSwitchPluginOptions>(
      optionsSchema,
      {
        ...defaultOptions,
        ...options,
      },
    );

    const {
      config,
      logger,
      mqttClient,
    } = plugin;

    const discover = discovery(plugin, opts);

    const discoveryRateLimit = wyt(1, opts.pollingInterval);
    const updateRateLimit = wyt(1, opts.pollingInterval);
    const publishSensorRateLimit = wyt(1, opts.sensorUpdateInterval);

    function getSensorTopic(details: SwitchDetails, sensorType: SensorType): string {
      const sensorKey = helpers.getSensorKey(sensorType);
      return `${opts.mqttTopic}/${details.mac}/${sensorKey}`;
    }

    const hostToMacMapping: { [host: string]: string } = {};
    const switchDetails: { [mac: string]: SwitchDetails } = {};
    const switchStates = new SwitchStates();
    const sensorBuffer: SensorBuffer = {};

    function addSensorValue(mac: string, sensorType: SensorType, value: number): void {
      if (!sensorBuffer[mac]) {
        sensorBuffer[mac] = {};
      }
      const existingValues = sensorBuffer[mac][sensorType] || [];
      sensorBuffer[mac][sensorType] = [...existingValues, value];
    }

    function getAvgSensorValue(mac: string, sensorType: SensorType): number | undefined {
      if (!sensorBuffer[mac]) {
        return undefined;
      }
      const values = sensorBuffer[mac][sensorType] || [];
      if (values.length === 0) {
        return undefined;
      }
      return values.reduce((a, b) => a + b, 0) / values.length;
    }

    function clearSensorValue(mac: string, sensorType: SensorType): void {
      if (sensorBuffer[mac]) {
        sensorBuffer[mac][sensorType] = [];
      }
    }

    async function publishSensor(mac: string): Promise<void> {
      const details = switchDetails[mac];
      if (!details) {
        throw new Error('Unexpected code reached');
      }

      [
        SensorType.Power,
        SensorType.Temperature,
      ].forEach((sensorType) => {
        const avgValue = getAvgSensorValue(details.mac, sensorType);
        clearSensorValue(details.mac, sensorType);
        const unavailable = !switchStates.isAvailable(details.mac);

        if (typeof avgValue === 'undefined') {
          if (unavailable) {
            mqttClient.publish(
              getSensorTopic(details, SensorType.Power),
              Number(0).toFixed(getSensorPrecision(sensorType)),
            );
          }
          return;
        }

        logger.debug('publish sensor value', {
          mac: details.mac,
          name: details.name,
          sensorType,
          value: avgValue,
        });
        mqttClient.publish(
          getSensorTopic(details, sensorType),
          avgValue.toFixed(getSensorPrecision(sensorType)),
        );
      });
    }

    async function updateSwitchState(mac: string): Promise<void> {
      const details = switchDetails[mac];
      if (!details) {
        throw new Error('Unexpected code reached');
      }

      try {
        const report = await switchAPI.getReport(details.host);

        logger.debug('Fetched switch report', {
          mac: details.mac,
          name: details.name,
          ...report,
        });

        addSensorValue(details.mac, SensorType.Power, report.power);
        addSensorValue(details.mac, SensorType.Temperature, report.temperature);

        if (switchStates.getRelay(details.mac) !== report.relay) {
          logger.info('Switch relay changed', {
            mac: details.mac,
            name: details.name,
            relay: helpers.getRelayStateValue(report.relay),
          });
          mqttClient.publish(
            getSensorTopic(details, SensorType.Relay),
            helpers.getRelayStateValue(report.relay),
          );
        }
        if (!switchStates.isAvailable(details.mac)) {
          logger.info('Switch availability changed', {
            mac: details.mac,
            name: details.name,
            availability: getAvailabilityValue(Availability.Online),
          });
          mqttClient.publish(
            getSensorTopic(details, SensorType.Availability),
            getAvailabilityValue(Availability.Online),
          );
        }

        switchStates.setAvailability(details.mac, Availability.Online);
        switchStates.setRelay(details.mac, report.relay);
      } catch (err) {
        logger.info('Switch unreachable', {
          mac: details.mac,
          name: details.name,
        });

        if (switchStates.isAvailable(details.mac)) {
          logger.info('Switch availability changed', {
            mac: details.mac,
            name: details.name,
            availability: getAvailabilityValue(Availability.Offline),
          });
          mqttClient.publish(
            getSensorTopic(details, SensorType.Availability),
            getAvailabilityValue(Availability.Offline),
          );
        }

        if (switchStates.isRelayOn(details.mac)) {
          logger.info('Switch relay changed due to unavailability', {
            mac: details.mac,
            name: details.name,
            relay: helpers.getRelayStateValue(RelayState.Off),
          });
          mqttClient.publish(
            getSensorTopic(details, SensorType.Relay),
            helpers.getRelayStateValue(RelayState.Off),
          );
        }

        // If switch becomes unavailable publish remaining power data, then publish 0
        if (switchStates.isAvailable(details.mac)) {
          logger.debug('Flushing sensor values and setting power to 0', {
            mac: details.mac,
            name: details.name,
          });
          publishSensor(details.mac);
          addSensorValue(details.mac, SensorType.Power, 0);

          mqttClient.publish(
            getSensorTopic(details, SensorType.Power),
            Number(0).toFixed(getSensorPrecision(SensorType.Power)),
          );
        }

        switchStates.setAvailability(details.mac, Availability.Offline);
        switchStates.setRelay(details.mac, RelayState.Off);
      }
    }

    async function handleRelayCommand(mac: string, relayState: RelayState): Promise<void> {
      const details = switchDetails[mac];
      if (!details) {
        return;
      }

      logger.info('Received relay command', {
        mac: details.mac,
        name: details.name,
        command: helpers.getRelayStateValue(relayState),
      });

      publishSensor(mac);
      try {
        switchAPI.setRelayState(details.host, relayState);
      } catch (err) {
        logger.error('Failed to set relay state', err);
      }

      switchStates.setRelay(mac, relayState);

      mqttClient.publish(
        getSensorTopic(details, SensorType.Relay),
        helpers.getRelayStateValue(relayState),
      );
    }

    async function announceSwitch(switchConfig: SwitchConfig): Promise<void> {
      try {
        const info = await switchAPI.getInfo(switchConfig.host);
        const details: SwitchDetails = {
          name: switchConfig.name,
          host: switchConfig.host,
          mac: info.mac,
          ip: info.ip,
          deviceName: info.name,
          deviceType: info.type,
          firmwareVersion: info.version,
        };

        hostToMacMapping[details.host] = details.mac;
        switchDetails[details.mac] = details;

        mqttClient.subscribe(
          getSensorTopic(details, SensorType.RelayCommand),
          (message: string) => {
            const relayState = helpers.getRelayStateByValue(message);
            if (relayState) {
              handleRelayCommand(details.mac, relayState);
            }
          },
        );

        if (config.homeAssistant && config.homeAssistant.discovery) {
          discover.announceSwitch(details);
        }
      } catch (err) {
        logger.error(`Switch '${switchConfig.host}' unreachable`);
      }
    }

    async function announceSwitches(): Promise<void> {
      const unannouncedSwitches = opts.switches.filter((switchConfig) => {
        const mac = hostToMacMapping[switchConfig.host];
        if (!mac) {
          return true;
        }
        return !switchDetails[mac];
      });

      await discoveryRateLimit();
      await Promise.all(unannouncedSwitches.map(announceSwitch));
      announceSwitches();
    }

    async function publishSensorValues(): Promise<void> {
      await publishSensorRateLimit();
      await Promise.all(Object.keys(switchDetails).map(publishSensor));
      publishSensorValues();
    }

    async function updateSwitchStates(): Promise<void> {
      await updateRateLimit();
      await Promise.all(Object.keys(switchDetails).map(updateSwitchState));
      updateSwitchStates();
    }

    announceSwitches();
    updateSwitchStates();
    publishSensorValues();

    return Promise.resolve();
  },
};
