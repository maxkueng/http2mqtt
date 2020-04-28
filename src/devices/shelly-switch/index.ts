import Joi from '@hapi/joi';
import * as validationHelpers from 'helpers/validation';
import * as baseSwitch from 'devices/base-switch';
import * as baseSwitchTypes from 'devices/base-switch/types';
import type {
  PluginOptions,
  PluginInterface,
} from 'server/plugin-manager';
import * as shellyAPI from './shelly-api';
import { DeviceType } from './types';
import type {
  ShellyPluginOptions,
  SwitchConfig,
} from './types';

const switchConfigSchema = Joi.object({
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  type: Joi.string().required().valid(...Object.values(DeviceType)),
  host: Joi.alternatives(
    Joi.string().ip(),
    Joi.string().hostname(),
  ),
  name: Joi.string().required().min(3).max(32),
  username: Joi.string().optional().default('admin'),
  password: Joi.string().optional(),
});

const optionsSchema = Joi.object({
  mqttTopic: Joi.string().required(),
  pollingInterval: Joi.number().integer().greater(999).required(),
  sensorUpdateInterval: Joi.number().integer().greater(Joi.ref('pollingInterval')).required(),
  switches: Joi.array().items(switchConfigSchema),
});

export default {
  name: 'shelly-switch',
  version: '1.0.0',
  async initialize(
    plugin: PluginInterface,
    options: PluginOptions = {},
  ): Promise<void> {
    const defaultOptions = {
      pollingInterval: 5000,
      sensorUpdateInterval: 5 * 60000,
      mqttTopic: 'http2mqtt/shelly/wifi_relays',
    };
    const opts = validationHelpers.validate<ShellyPluginOptions>(
      optionsSchema,
      {
        ...defaultOptions,
        ...options,
      },
    );

    function getShellyRelayState(relayState: baseSwitchTypes.RelayState): shellyAPI.RelayState {
      switch (relayState) {
        case baseSwitchTypes.RelayState.On:
          return shellyAPI.RelayState.On;
        case baseSwitchTypes.RelayState.Off:
          return shellyAPI.RelayState.Off;
        default:
          throw new Error(`Unknown relay state '${relayState}'`);
      }
    }

    function getBaseSwitchRelayState(relayState: shellyAPI.RelayState): baseSwitchTypes.RelayState {
      switch (relayState) {
        case shellyAPI.RelayState.On:
          return baseSwitchTypes.RelayState.On;
        case shellyAPI.RelayState.Off:
          return baseSwitchTypes.RelayState.Off;
        default:
          throw new Error(`Unknown relay state '${relayState}'`);
      }
    }

    function getSwitchConfig(switchID: string): SwitchConfig | undefined {
      return opts.switches.find((switchConfig) => switchConfig.host === switchID);
    }

    function getShellyOptions({
      host,
      username,
      password,
    }: SwitchConfig): shellyAPI.Options {
      return {
        host,
        username,
        password,
      };
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

        const info = await shellyAPI.getInfo(getShellyOptions(switchConfig));
        const details: baseSwitchTypes.SwitchDetails = {
          name: switchConfig.name,
          host: switchConfig.host,
          mac: info.mac,
          ip: switchConfig.host,
          deviceName: info.name,
          deviceType: info.type,
          deviceManufacturer: 'Allterco Robotics',
          firmwareVersion: info.version,
        };

        return details;
      },

      getSensorTypes(switchID: string): baseSwitchTypes.SensorType[] {
        const switchConfig = getSwitchConfig(switchID);
        if (!switchConfig) {
          throw new Error(`Switch '${switchID}' not found`);
        }

        switch (switchConfig.type) {
          case DeviceType.Shelly1:
            return [
              baseSwitchTypes.SensorType.Relay,
            ];
          case DeviceType.Shelly1PM:
            return [
              baseSwitchTypes.SensorType.Power,
              baseSwitchTypes.SensorType.Temperature,
              baseSwitchTypes.SensorType.Relay,
            ];
          default:
            throw new Error(`unknown device type '${switchConfig.type}'`);
        }
      },

      async getSensorReport(switchID: string): Promise<baseSwitchTypes.SensorReport | undefined> {
        const switchConfig = getSwitchConfig(switchID);
        if (!switchConfig) {
          return undefined;
        }

        const report = await shellyAPI.getReport(getShellyOptions(switchConfig));

        return {
          [baseSwitchTypes.SensorType.Relay]: getBaseSwitchRelayState(report[shellyAPI.SensorType.Relay]),
          [baseSwitchTypes.SensorType.Power]: report[shellyAPI.SensorType.Power],
          [baseSwitchTypes.SensorType.Temperature]: report[shellyAPI.SensorType.Temperature],
        };
      },

      async setRelayState(switchID: string, relayState: baseSwitchTypes.RelayState): Promise<void> {
        const switchConfig = getSwitchConfig(switchID);
        if (!switchConfig) {
          throw new Error(`Switch '${switchID}' not found`);
        }

        await shellyAPI.setRelayState(getShellyOptions(switchConfig), getShellyRelayState(relayState));
      },
    };

    const baseSwitchOptions: baseSwitchTypes.BaseSwitchOptions = {
      pollingInterval: opts.pollingInterval,
      sensorUpdateInterval: opts.sensorUpdateInterval,
      mqttTopic: opts.mqttTopic,
      discoveryMQTTNodeID: 'shelly',
      client,
    };

    return baseSwitch.initialize(plugin, baseSwitchOptions);
  },
};
