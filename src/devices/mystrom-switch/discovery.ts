import * as formattingHelpers from 'helpers/formatting';
import * as homeAssistantHelpers from 'helpers/homeassistant';
import type { DeviceInfo } from 'helpers/homeassistant';
import type { PluginInterface } from 'server/plugin-manager';
import * as helpers from './helpers';
import {
  SensorType,
  RelayState,
} from './types';
import type {
  MyStromSwitchPluginOptions,
  SwitchDetails,
} from './types';

function getSensorUnitOfMeasurement(type: SensorType): string {
  switch (type) {
    case SensorType.Power:
      return 'W';
    case SensorType.Temperature:
      return '°C';
    default:
      throw new Error(`Unknown sensor type '${type}'`);
  }
}

function getSensorDeviceClass(type: SensorType): homeAssistantHelpers.SensorDeviceClass {
  switch (type) {
    case SensorType.Power:
      return homeAssistantHelpers.SensorDeviceClass.Power;
    case SensorType.Temperature:
      return homeAssistantHelpers.SensorDeviceClass.Temperature;
    default:
      return homeAssistantHelpers.SensorDeviceClass.None;
  }
}

interface Discovery {
  announceSwitch: (details: SwitchDetails) => Promise<void>;
}

const getDeviceInfo = (details: SwitchDetails): DeviceInfo => ({
  identifiers: [details.mac],
  connections: [
    ['mac', formattingHelpers.formatMacAddress(details.mac)],
  ],
  model: details.deviceName,
  name: `${details.name}`,
  manufacturer: 'myStrom AG',
  firmwareVersion: details.firmwareVersion,
});

export default function discovery(
  plugin: PluginInterface,
  options: MyStromSwitchPluginOptions,
): Discovery {
  const { mqttClient } = plugin;

  const getSensorConfig = (
    details: SwitchDetails,
    sensorType: SensorType,
  ): homeAssistantHelpers.HASensorConfig => {
    const sensorKey = helpers.getSensorKey(sensorType);
    const availabilitySensorKey = helpers.getSensorKey(SensorType.Availability);

    return {
      name: `${details.name} ${sensorKey}`,
      uniqueID: `${details.mac}_${sensorKey}`,
      deviceClass: getSensorDeviceClass(sensorType),
      device: getDeviceInfo(details),
      availabilityTopic: `${options.mqttTopic}/${details.mac}/${availabilitySensorKey}`,
      stateTopic: `${options.mqttTopic}/${details.mac}/${sensorKey}`,
      unitOfMeasurement: getSensorUnitOfMeasurement(sensorType),
      forceUpdate: true,
    };
  };

  const getSwitchConfig = (
    details: SwitchDetails,
    sensorType: SensorType,
  ): homeAssistantHelpers.HASwitchConfig => {
    const sensorKey = helpers.getSensorKey(sensorType);
    const relayCommandSensorKey = helpers.getSensorKey(SensorType.RelayCommand);
    const availabilitySensorKey = helpers.getSensorKey(SensorType.Availability);

    return {
      name: `${details.name} ${sensorKey}`,
      uniqueID: `${details.mac}_${sensorKey}`,
      device: getDeviceInfo(details),
      commandTopic: `${options.mqttTopic}/${details.mac}/${relayCommandSensorKey}`,
      availabilityTopic: `${options.mqttTopic}/${details.mac}/${availabilitySensorKey}`,
      stateTopic: `${options.mqttTopic}/${details.mac}/${sensorKey}`,
      payloadOff: helpers.getRelayStateValue(RelayState.Off),
      payloadOn: helpers.getRelayStateValue(RelayState.On),
      stateOff: helpers.getRelayStateValue(RelayState.Off),
      stateOn: helpers.getRelayStateValue(RelayState.On),
    };
  };

  async function publishSensorDiscovery(details: SwitchDetails, sensorType: SensorType): Promise<void> {
    const sensorConfig = getSensorConfig(details, sensorType);
    const discoveryConfig = homeAssistantHelpers.marshalSensorConfig(sensorConfig);
    const discoveryTopic = homeAssistantHelpers.getDiscoveryTopic(
      homeAssistantHelpers.ComponentType.Sensor,
      'myStrom',
      sensorConfig.uniqueID || details.mac,
    );
    await mqttClient.publish(discoveryTopic, discoveryConfig, { retain: true });
  }

  async function publishSwitchDiscovery(details: SwitchDetails, sensorType: SensorType): Promise<void> {
    const switchConfig = getSwitchConfig(details, sensorType);
    const discoveryConfig = homeAssistantHelpers.marshalSwitchConfig(switchConfig);
    const discoveryTopic = homeAssistantHelpers.getDiscoveryTopic(
      homeAssistantHelpers.ComponentType.Switch,
      'myStrom',
      switchConfig.uniqueID || details.mac,
    );
    await mqttClient.publish(discoveryTopic, discoveryConfig, { retain: true });
  }

  async function announceSwitch(details: SwitchDetails): Promise<void> {
    await Promise.all([
      SensorType.Relay,
      SensorType.Power,
      SensorType.Temperature,
    ].map((sensorType: SensorType) => {
      switch (sensorType) {
        case SensorType.Power:
        case SensorType.Temperature:
          return publishSensorDiscovery(details, sensorType);
        case SensorType.Relay:
          return publishSwitchDiscovery(details, sensorType);
        default:
          throw new Error(`Unexpected sensor type '${sensorType}'`);
      }
    }));
  }

  return { announceSwitch };
}
