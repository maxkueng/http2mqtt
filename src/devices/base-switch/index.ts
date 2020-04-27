import wyt from 'wyt';
import type { PluginInterface } from 'server/plugin-manager';
import * as helpers from './helpers';
import SwitchStates from './switch-states';
import discovery from './discovery';
import {
  SensorType,
  RelayState,
  Availability,
} from './types';
import type {
  SwitchDetails,
  BaseSwitchOptions,
} from './types';

// Sensors that will be reported with value 0 if the switch is unavailable
const zeroedSensorTypes = [
  SensorType.Power,
  SensorType.Amperage,
];

const numericSensorTypes = [
  SensorType.Power,
  SensorType.Amperage,
  SensorType.Temperature,
];

function getSensorPrecision(sensorType: SensorType): number {
  switch (sensorType) {
    case SensorType.Power:
    case SensorType.Amperage:
      return 3;
    case SensorType.Temperature:
    default:
      return 2;
  }
}

type SensorBuffer = {
  [mac: string]: {
    [sensorType in SensorType]?: number[];
  };
}

export async function initialize(
  plugin: PluginInterface,
  opts: BaseSwitchOptions,
): Promise<void> {
  const {
    config,
    logger,
    mqttClient,
  } = plugin;

  const { client } = opts;

  const discover = discovery(plugin, opts);

  const discoveryRateLimit = wyt(1, opts.pollingInterval);
  const updateRateLimit = wyt(1, opts.pollingInterval);
  const publishSensorRateLimit = wyt(1, opts.sensorUpdateInterval);

  function getSensorTopic(details: SwitchDetails, sensorType: SensorType): string {
    const sensorKey = helpers.getSensorKey(sensorType);
    return `${opts.mqttTopic}/${details.mac}/${sensorKey}`;
  }

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

  async function publishSensor(switchID: string): Promise<void> {
    const details = switchDetails[switchID];
    if (!details) {
      throw new Error('Unexpected code reached');
    }

    mqttClient.publish(
      getSensorTopic(details, SensorType.Availability),
      helpers.getAvailabilityValue(Availability.Online),
      { retain: true },
    );

    const clientSensorTypes = client.getSensorTypes(switchID);

    numericSensorTypes.forEach((sensorType) => {
      if (clientSensorTypes.includes(sensorType)) {
        const avgValue = getAvgSensorValue(switchID, sensorType);
        clearSensorValue(switchID, sensorType);

        if (typeof avgValue === 'undefined') {
          const unavailable = !switchStates.isAvailable(switchID);
          if (unavailable && zeroedSensorTypes.includes(sensorType)) {
            mqttClient.publish(
              getSensorTopic(details, sensorType),
              Number(0).toFixed(getSensorPrecision(sensorType)),
            );
          }
          return;
        }

        logger.debug('Publish sensor value', {
          mac: details.mac,
          name: details.name,
          sensorType,
          value: avgValue,
        });
        mqttClient.publish(
          getSensorTopic(details, sensorType),
          avgValue.toFixed(getSensorPrecision(sensorType)),
        );
      }
    });
  }

  async function updateSwitchState(switchID: string): Promise<void> {
    const details = switchDetails[switchID];
    if (!details) {
      throw new Error('Unexpected code reached');
    }

    try {
      const report = await client.getSensorReport(switchID);
      if (!report) {
        return;
      }

      logger.debug('Fetched switch report', {
        mac: details.mac,
        name: details.name,
        ...report,
      });

      numericSensorTypes.forEach((sensorType) => {
        if (Object.keys(report).includes(sensorType)) {
          switch (sensorType) {
            case SensorType.Power:
            case SensorType.Amperage:
            case SensorType.Temperature:
              addSensorValue(switchID, sensorType, report[sensorType] || 0);
              break;
            default:
              throw new Error(`Unknown sensor type '${sensorType}'`);
          }
        }
      });

      const { [SensorType.Relay]: relayState } = report;

      if (switchStates.getRelay(switchID) !== relayState) {
        logger.info('Switch relay changed', {
          mac: details.mac,
          name: details.name,
          relay: helpers.getRelayStateValue(relayState),
        });
        mqttClient.publish(
          getSensorTopic(details, SensorType.Relay),
          helpers.getRelayStateValue(relayState),
        );
      }
      if (!switchStates.isAvailable(switchID)) {
        logger.info('Switch availability changed', {
          mac: details.mac,
          name: details.name,
          availability: helpers.getAvailabilityValue(Availability.Online),
        });
        mqttClient.publish(
          getSensorTopic(details, SensorType.Availability),
          helpers.getAvailabilityValue(Availability.Online),
          { retain: true },
        );
      }

      switchStates.setAvailability(switchID, Availability.Online);
      switchStates.setRelay(switchID, relayState);
    } catch (err) {
      logger.info('Switch unreachable', {
        mac: details.mac,
        name: details.name,
      });

      if (switchStates.isAvailable(switchID)) {
        logger.info('Switch availability changed', {
          mac: details.mac,
          name: details.name,
          availability: helpers.getAvailabilityValue(Availability.Offline),
        });
        mqttClient.publish(
          getSensorTopic(details, SensorType.Availability),
          helpers.getAvailabilityValue(Availability.Offline),
          { retain: true },
        );
      }

      if (switchStates.isRelayOn(switchID)) {
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

      // If switch becomes unavailable, publish remaining power data, then publish 0
      if (switchStates.isAvailable(switchID)) {
        logger.debug('Flushing sensor values and setting power to 0', {
          mac: details.mac,
          name: details.name,
        });
        publishSensor(switchID);

        const clientSensorTypes = client.getSensorTypes(switchID);

        zeroedSensorTypes.forEach((sensorType) => {
          if (clientSensorTypes.includes(sensorType)) {
            addSensorValue(switchID, sensorType, 0);

            mqttClient.publish(
              getSensorTopic(details, SensorType.Power),
              Number(0).toFixed(getSensorPrecision(sensorType)),
            );
          }
        });
      }

      switchStates.setAvailability(switchID, Availability.Offline);
      switchStates.setRelay(switchID, RelayState.Off);
    }
  }

  async function handleRelayCommand(switchID: string, relayState: RelayState): Promise<void> {
    const details = switchDetails[switchID];
    if (!details) {
      return;
    }

    logger.info('Received relay command', {
      mac: details.mac,
      name: details.name,
      command: helpers.getRelayStateValue(relayState),
    });

    publishSensor(switchID);
    try {
      await client.setRelayState(switchID, relayState);
    } catch (err) {
      logger.error('Failed to set relay state', err);
      return;
    }

    switchStates.setRelay(switchID, relayState);

    mqttClient.publish(
      getSensorTopic(details, SensorType.Relay),
      helpers.getRelayStateValue(relayState),
    );
  }

  async function announceSwitch(switchID: string): Promise<void> {
    try {
      const details = await client.getSwitchDetails(switchID);
      if (!details) {
        throw new Error(`Switch '${switchID}' not found`);
      }

      switchDetails[switchID] = details;

      mqttClient.subscribe(
        getSensorTopic(details, SensorType.RelayCommand),
        (message: string) => {
          const relayState = helpers.getRelayStateByValue(message);
          if (relayState) {
            handleRelayCommand(switchID, relayState);
          }
        },
      );

      if (config.homeAssistant && config.homeAssistant.discovery) {
        const clientSensorTypes = client.getSensorTypes(switchID);
        discover.announceSwitch(details, clientSensorTypes);
      }

      mqttClient.publish(
        getSensorTopic(details, SensorType.Availability),
        helpers.getAvailabilityValue(Availability.Online),
        { retain: true },
      );
    } catch (err) {
      logger.error(`Switch '${switchID}' unreachable`);
    }
  }

  async function announceSwitches(): Promise<void> {
    const switchIDs = client.getSwitchIDs();
    const unannouncedSwitches = switchIDs.filter((switchID) => !switchDetails[switchID]);

    await discoveryRateLimit();
    await Promise.all(unannouncedSwitches.map(announceSwitch));
    announceSwitches();
  }

  async function publishSensorValues(): Promise<void> {
    await publishSensorRateLimit();
    const switchIDs = Object.keys(switchDetails);
    await Promise.all(switchIDs.map(publishSensor));
    publishSensorValues();
  }

  async function updateSwitchStates(): Promise<void> {
    await updateRateLimit();
    const switchIDs = Object.keys(switchDetails);
    await Promise.all(switchIDs.map(updateSwitchState));
    updateSwitchStates();
  }

  announceSwitches();
  updateSwitchStates();
  publishSensorValues();

  return Promise.resolve();
}
