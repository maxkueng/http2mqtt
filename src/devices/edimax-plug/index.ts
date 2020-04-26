import Joi from '@hapi/joi';
import * as ediplug from 'ediplug';
import * as validationHelpers from 'helpers/validation';
import * as baseSwitch from 'devices/base-switch';
import * as baseSwitchTypes from 'devices/base-switch/types';
import type {
  PluginOptions,
  PluginInterface,
} from 'server/plugin-manager';
import type {
  EdimaxPlugPluginOptions,
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
  username: Joi.string().optional().default('admin'),
  password: Joi.string().required(),
});

const optionsSchema = Joi.object({
  mqttTopic: Joi.string().required(),
  pollingInterval: Joi.number().integer().greater(999).required(),
  sensorUpdateInterval: Joi.number().integer().greater(Joi.ref('pollingInterval')).required(),
  switches: Joi.array().items(switchConfigSchema),
});

export default {
  name: 'edimax-plug',
  version: '1.0.0',
  async initialize(
    plugin: PluginInterface,
    options: PluginOptions = {},
  ): Promise<void> {
    const defaultOptions = {
      pollingInterval: 5000,
      sensorUpdateInterval: 5 * 60000,
      mqttTopic: 'http2mqtt/edimax/wifi_plugs',
    };
    const opts = validationHelpers.validate<EdimaxPlugPluginOptions>(
      optionsSchema,
      {
        ...defaultOptions,
        ...options,
      },
    );

    function getEdiplugRelayState(relayState: baseSwitchTypes.RelayState): ediplug.RelayState {
      switch (relayState) {
        case baseSwitchTypes.RelayState.On:
          return ediplug.RelayState.On;
        case baseSwitchTypes.RelayState.Off:
          return ediplug.RelayState.Off;
        default:
          throw new Error(`Unknown relay state '${relayState}'`);
      }
    }

    function getBaseSwitchRelayState(relayState: ediplug.RelayState): baseSwitchTypes.RelayState {
      switch (relayState) {
        case ediplug.RelayState.On:
          return baseSwitchTypes.RelayState.On;
        case ediplug.RelayState.Off:
          return baseSwitchTypes.RelayState.Off;
        default:
          throw new Error(`Unknown relay state '${relayState}'`);
      }
    }

    function getSwitchConfig(switchID: string): SwitchConfig | undefined {
      return opts.switches.find((switchConfig) => switchConfig.host === switchID);
    }

    function getEdiplugOptions({
      host,
      username,
      password,
    }: SwitchConfig): ediplug.Options {
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

        const info = await ediplug.getDeviceInfo(getEdiplugOptions(switchConfig));
        const details: baseSwitchTypes.SwitchDetails = {
          name: switchConfig.name,
          host: switchConfig.host,
          mac: info.mac,
          ip: switchConfig.host,
          deviceName: info.model,
          deviceType: info.model,
          deviceManufacturer: 'Edimax Technology Co., Ltd',
          firmwareVersion: info.fwVersion,
        };

        return details;
      },

      getSensorTypes(): baseSwitchTypes.SensorType[] {
        return [
          baseSwitchTypes.SensorType.Power,
          baseSwitchTypes.SensorType.Amperage,
          baseSwitchTypes.SensorType.Relay,
        ];
      },

      async getSensorReport(switchID: string): Promise<baseSwitchTypes.SensorReport | undefined> {
        const switchConfig = getSwitchConfig(switchID);
        if (!switchConfig) {
          return undefined;
        }

        const report = await ediplug.getReport(getEdiplugOptions(switchConfig));

        return {
          [baseSwitchTypes.SensorType.Relay]: getBaseSwitchRelayState(report.relay),
          [baseSwitchTypes.SensorType.Power]: report.power,
          [baseSwitchTypes.SensorType.Amperage]: report.current,
        };
      },

      async setRelayState(switchID: string, relayState: baseSwitchTypes.RelayState): Promise<void> {
        const switchConfig = getSwitchConfig(switchID);
        if (!switchConfig) {
          throw new Error(`Switch '${switchID}' not found`);
        }

        await ediplug.setRelayState(
          getEdiplugOptions(switchConfig),
          getEdiplugRelayState(relayState),
        );
      },
    };

    const baseSwitchOptions: baseSwitchTypes.BaseSwitchOptions = {
      pollingInterval: opts.pollingInterval,
      sensorUpdateInterval: opts.sensorUpdateInterval,
      mqttTopic: opts.mqttTopic,
      discoveryMQTTNodeID: 'edimax',
      client,
    };

    return baseSwitch.initialize(plugin, baseSwitchOptions);
  },
};
