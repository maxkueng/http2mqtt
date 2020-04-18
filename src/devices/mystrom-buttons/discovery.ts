import * as formattingHelpers from 'helpers/formatting';
import * as homeAssistantHelpers from 'helpers/homeassistant';
import type { DeviceInfo } from 'helpers/homeassistant';
import type { PluginInterface } from 'server/plugin-manager';
import * as helpers from './helpers';
import {
  ActionID,
  ButtonType,
} from './types';
import type {
  ButtonLightConfig,
  ButtonPlusConfig,
  ButtonConfig,
  MyStromButtonPluginOptions,
} from './types';

function getSensorUnitOfMeasurement(actionID: ActionID): string | undefined {
  switch (actionID) {
    case ActionID.Battery:
      return '%';
    default:
      return undefined;
  }
}

function getButtonModelName(type: ButtonType): string {
  switch (type) {
    case ButtonType.Button:
      return 'Wifi Button';
    case ButtonType.ButtonPlus:
      return 'Wifi Button Plus';
    default:
      throw new Error('Unknown button type');
  }
}

function getActionComponentType(actionID: ActionID): homeAssistantHelpers.ComponentType {
  switch (actionID) {
    case ActionID.Single:
    case ActionID.Double:
    case ActionID.Long:
    case ActionID.Touch:
    case ActionID.WheelFinal:
      return homeAssistantHelpers.ComponentType.BinarySensor;
    case ActionID.Wheel:
    case ActionID.Battery:
      return homeAssistantHelpers.ComponentType.Sensor;
    default:
      throw new Error(`Invalid action id '${actionID}'`);
  }
}

const getDeviceInfo = (button: ButtonConfig): DeviceInfo => ({
  identifiers: [button.mac],
  connections: [
    ['mac', formattingHelpers.formatMacAddress(button.mac)],
  ],
  model: getButtonModelName(button.type),
  name: `${button.name}`,
  manufacturer: 'myStrom AG',
});

interface Discovery {
  announceButtons: (buttons: ButtonConfig[]) => Promise<void>;
}

export default function discovery(
  plugin: PluginInterface,
  options: MyStromButtonPluginOptions,
): Discovery {
  const { mqttClient } = plugin;

  const getBinarySensorConfig = (
    button: ButtonConfig,
    actionID: ActionID,
  ): homeAssistantHelpers.HABinarySensorConfig => {
    const actionName = helpers.getActionName(actionID);
    return {
      name: `${button.name} ${actionName}`,
      uniqueID: `${button.mac}_${actionName}`,
      device: getDeviceInfo(button),
      stateTopic: `${options.mqttTopic}/${button.mac}/${actionName}`,
      valueTemplate: '{{ value | upper }}',
      payloadOn: 'ON',
      payloadOff: 'OFF',
      offDelay: 1,
    };
  };

  const getSensorConfig = (
    button: ButtonConfig,
    actionID: ActionID,
  ): homeAssistantHelpers.HASensorConfig => {
    const actionName = helpers.getActionName(actionID);
    return {
      name: `${button.name} ${actionName}`,
      uniqueID: `${button.mac}_${actionName}`,
      device: getDeviceInfo(button),
      stateTopic: `${options.mqttTopic}/${button.mac}/${actionName}`,
      unitOfMeasurement: getSensorUnitOfMeasurement(actionID),
    };
  };

  async function publishBinarySensorDiscovery(button: ButtonConfig, actionID: ActionID): Promise<void> {
    const binarySensorConfig = getBinarySensorConfig(button, actionID);
    const discoveryConfig = homeAssistantHelpers.marshalBinarySensorConfig(binarySensorConfig);
    const discoveryTopic = homeAssistantHelpers.getDiscoveryTopic(
      getActionComponentType(actionID),
      'myStrom',
      binarySensorConfig.uniqueID || button.mac,
    );
    await mqttClient.publish(discoveryTopic, discoveryConfig, { retain: true });
  }

  async function publishSensorDiscovery(button: ButtonConfig, actionID: ActionID): Promise<void> {
    const sensorConfig = getSensorConfig(button, actionID);
    const discoveryConfig = homeAssistantHelpers.marshalSensorConfig(sensorConfig);
    const discoveryTopic = homeAssistantHelpers.getDiscoveryTopic(
      getActionComponentType(actionID),
      'myStrom',
      sensorConfig.uniqueID || button.mac,
    );
    await mqttClient.publish(discoveryTopic, discoveryConfig, { retain: true });
  }

  async function announceButton(button: ButtonLightConfig): Promise<void> {
    await Promise.all([
      ActionID.Single,
      ActionID.Double,
      ActionID.Long,
      ActionID.Battery,
    ].map((actionID: ActionID) => {
      switch (actionID) {
        case ActionID.Single:
        case ActionID.Double:
        case ActionID.Long:
          return publishBinarySensorDiscovery(button, actionID);
        case ActionID.Battery:
          return publishSensorDiscovery(button, actionID);
        default:
          throw new Error('Unexpected actionID');
      }
    }));
  }

  async function announceButtonPlus(button: ButtonPlusConfig): Promise<void> {
    await Promise.all([
      ActionID.Single,
      ActionID.Double,
      ActionID.Long,
      ActionID.Touch,
      ActionID.WheelFinal,
      ActionID.Battery,
      ActionID.Wheel,
    ].map((actionID: ActionID) => {
      switch (actionID) {
        case ActionID.Single:
        case ActionID.Double:
        case ActionID.Long:
        case ActionID.Touch:
        case ActionID.WheelFinal:
          return publishBinarySensorDiscovery(button, actionID);
        case ActionID.Battery:
        case ActionID.Wheel:
          return publishSensorDiscovery(button, actionID);
        default:
          throw new Error('Unexpected actionID');
      }
    }));
  }

  async function announceButtons(buttons: ButtonConfig[]): Promise<void> {
    await Promise.all(buttons.map((button: ButtonConfig) => {
      switch (button.type) {
        case ButtonType.Button:
          return announceButton(button);
        case ButtonType.ButtonPlus:
          return announceButtonPlus(button);
        default:
          throw new Error('Unknown button type');
      }
    }));
  }

  return { announceButtons };
}
