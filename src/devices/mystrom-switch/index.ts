import Joi from '@hapi/joi';
import * as validationHelpers from 'helpers/validation';
import * as baseSwitch from 'devices/base-switch';
import * as baseSwitchTypes from 'devices/base-switch/types';
import type {
  PluginOptions,
  PluginInterface,
} from 'server/plugin-manager';
import * as switchAPI from './switch-api';
import type {
  MyStromSwitchPluginOptions,
  SwitchConfig,
} from './types';

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
      mqttTopic: 'http2mqtt/mystrom/wifi_switches',
    };
    const opts = validationHelpers.validate<MyStromSwitchPluginOptions>(
      optionsSchema,
      {
        ...defaultOptions,
        ...options,
      },
    );

    function getMyStromRelayState(relayState: baseSwitchTypes.RelayState): switchAPI.RelayState {
      switch (relayState) {
        case baseSwitchTypes.RelayState.On:
          return switchAPI.RelayState.On;
        case baseSwitchTypes.RelayState.Off:
          return switchAPI.RelayState.Off;
        default:
          throw new Error(`Unknown relay state '${relayState}'`);
      }
    }

    function getBaseSwitchRelayState(relayState: switchAPI.RelayState): baseSwitchTypes.RelayState {
      switch (relayState) {
        case switchAPI.RelayState.On:
          return baseSwitchTypes.RelayState.On;
        case switchAPI.RelayState.Off:
          return baseSwitchTypes.RelayState.Off;
        default:
          throw new Error(`Unknown relay state '${relayState}'`);
      }
    }

    function getSwitchConfig(switchID: string): SwitchConfig | undefined {
      return opts.switches.find((switchConfig) => switchConfig.host === switchID);
    }

    const client: baseSwitchTypes.SwitchClient = {
      getSwitchIDs(): string[] {
        return opts.switches.map((switchConfig) => switchConfig.host);
      },

      async getSwitchDetails(switchID: string): Promise<baseSwitchTypes.SwitchDetails | undefined> {
        const switchConfig = getSwitchConfig(switchID);
        if (!switchConfig) {
          return undefined;
        }

        const info = await switchAPI.getInfo(switchConfig.host);
        const details: baseSwitchTypes.SwitchDetails = {
          name: switchConfig.name,
          host: switchConfig.host,
          mac: info.mac,
          ip: switchConfig.host,
          deviceName: info.name,
          deviceType: info.type,
          deviceManufacturer: 'myStrom AG',
          firmwareVersion: info.version,
        };

        return details;
      },

      getSensorTypes(): baseSwitchTypes.SensorType[] {
        return [
          baseSwitchTypes.SensorType.Power,
          baseSwitchTypes.SensorType.Temperature,
          baseSwitchTypes.SensorType.Relay,
        ];
      },

      async getSensorReport(switchID: string): Promise<baseSwitchTypes.SensorReport | undefined> {
        const switchConfig = getSwitchConfig(switchID);
        if (!switchConfig) {
          return undefined;
        }

        const report = await switchAPI.getReport(switchConfig.host);

        return {
          [baseSwitchTypes.SensorType.Relay]: getBaseSwitchRelayState(report[switchAPI.SensorType.Relay]),
          [baseSwitchTypes.SensorType.Power]: report[switchAPI.SensorType.Power],
          [baseSwitchTypes.SensorType.Temperature]: report[switchAPI.SensorType.Temperature],
        };
      },

      async setRelayState(switchID: string, relayState: baseSwitchTypes.RelayState): Promise<void> {
        const switchConfig = getSwitchConfig(switchID);
        if (!switchConfig) {
          throw new Error(`Switch '${switchID}' not found`);
        }

        await switchAPI.setRelayState(switchConfig.host, getMyStromRelayState(relayState));
      },
    };

    const baseSwitchOptions: baseSwitchTypes.BaseSwitchOptions = {
      pollingInterval: opts.pollingInterval,
      sensorUpdateInterval: opts.sensorUpdateInterval,
      mqttTopic: opts.mqttTopic,
      discoveryMQTTNodeID: 'mystrom',
      client,
    };

    return baseSwitch.initialize(plugin, baseSwitchOptions);
  },
};
