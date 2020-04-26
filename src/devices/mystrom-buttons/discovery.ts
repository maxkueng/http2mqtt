import * as formattingHelpers from 'helpers/formatting';
import * as homeAssistantHelpers from 'helpers/homeassistant';
import type { DeviceInfo } from 'helpers/homeassistant';
import type { PluginInterface } from 'server/plugin-manager';
import * as helpers from './helpers';
import {
  ActionID,
  ButtonType,
  BinarySensorState,
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
      return homeAssistantHelpers.ComponentType.DeviceTrigger;
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

  function getDeviceTriggerType(actionID: ActionID): homeAssistantHelpers.DeviceTriggerType {
    switch (actionID) {
      case ActionID.Single:
        return homeAssistantHelpers.DeviceTriggerType.ButtonShortPress;
      case ActionID.Double:
        return homeAssistantHelpers.DeviceTriggerType.ButtonDoublePress;
      case ActionID.Long:
        return homeAssistantHelpers.DeviceTriggerType.ButtonLongPress;
      case ActionID.Touch:
        return homeAssistantHelpers.DeviceTriggerType.ButtonShortPress;
      case ActionID.WheelFinal:
        return homeAssistantHelpers.DeviceTriggerType.ButtonShortPress;
      default:
        throw new Error(`Invalid action id '${actionID}'`);
    }
  }

  function getDeviceTriggerSubtype(actionID: ActionID): homeAssistantHelpers.DeviceTriggerSubtype {
    switch (actionID) {
      case ActionID.Single:
        return homeAssistantHelpers.DeviceTriggerSubtype.Button1;
      case ActionID.Double:
        return homeAssistantHelpers.DeviceTriggerSubtype.Button1;
      case ActionID.Long:
        return homeAssistantHelpers.DeviceTriggerSubtype.Button1;
      case ActionID.Touch:
        return homeAssistantHelpers.DeviceTriggerSubtype.Button2;
      case ActionID.WheelFinal:
        return homeAssistantHelpers.DeviceTriggerSubtype.Button3;
      default:
        throw new Error(`Invalid action id '${actionID}'`);
    }
  }

  const getDeviceUniqueID = (
    button: ButtonConfig,
    actionID: ActionID,
  ): string => (
    `${button.mac}_${helpers.getActionName(actionID)}`
  );

  const getDeviceTriggerConfig = (
    button: ButtonConfig,
    actionID: ActionID,
  ): homeAssistantHelpers.HADeviceTriggerConfig => {
    const actionName = helpers.getActionName(actionID);
    return {
      payload: helpers.getBinarySensorStateValue(BinarySensorState.On),
      topic: `${options.mqttTopic}/${button.mac}/${actionName}`,
      type: getDeviceTriggerType(actionID),
      subtype: getDeviceTriggerSubtype(actionID),
      device: getDeviceInfo(button),
    };
  };

  const getSensorConfig = (
    button: ButtonConfig,
    actionID: ActionID,
  ): homeAssistantHelpers.HASensorConfig => {
    const actionName = helpers.getActionName(actionID);
    return {
      name: `${button.name} ${actionName}`,
      uniqueID: getDeviceUniqueID(button, actionID),
      device: getDeviceInfo(button),
      stateTopic: `${options.mqttTopic}/${button.mac}/${actionName}`,
      unitOfMeasurement: getSensorUnitOfMeasurement(actionID),
    };
  };

  async function publishDeviceTriggerDiscovery(button: ButtonConfig, actionID: ActionID): Promise<void> {
    const uniqueID = getDeviceUniqueID(button, actionID);
    const deviceTriggerConfig = getDeviceTriggerConfig(button, actionID);
    const discoveryConfig = homeAssistantHelpers.marshalDeviceTriggerConfig(deviceTriggerConfig);
    const discoveryTopic = homeAssistantHelpers.getDiscoveryTopic(
      getActionComponentType(actionID),
      'mystrom',
      uniqueID || button.mac,
    );
    await mqttClient.publish(discoveryTopic, discoveryConfig, { retain: true });
  }

  async function publishSensorDiscovery(button: ButtonConfig, actionID: ActionID): Promise<void> {
    const sensorConfig = getSensorConfig(button, actionID);
    const discoveryConfig = homeAssistantHelpers.marshalSensorConfig(sensorConfig);
    const discoveryTopic = homeAssistantHelpers.getDiscoveryTopic(
      getActionComponentType(actionID),
      'mystrom',
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
          return publishDeviceTriggerDiscovery(button, actionID);
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
          return publishDeviceTriggerDiscovery(button, actionID);
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
