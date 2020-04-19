/* eslint-disable @typescript-eslint/camelcase */

export enum ComponentType {
  Sensor = 'sensor',
  BinarySensor = 'binary_sensor',
  Switch = 'switch',
  DeviceTrigger = 'device_automation',
}

export type Template = string;

export interface DeviceInfo {
  connections?: [string, string | number][];
  identifiers?: string[];
  manufacturer?: string;
  model?: string;
  name?: string;
  firmwareVersion?: string;
  viaDevice?: string;
}
export interface HADeviceInfo {
  connections?: [string, string | number][];
  identifiers?: string[];
  manufacturer?: string;
  model?: string;
  name?: string;
  sw_version?: string;
  via_device?: string;
}

// https://www.home-assistant.io/integrations/binary_sensor/#device-class
export enum BinarySensorDeviceClass {
  None = '',
  Battery = 'battery',
  Cold = 'cold',
  Connectivity = 'connectivity',
  Door = 'door',
  GarageDoor = 'garage_door',
  Gas = 'gas',
  Heat = 'heat',
  Light = 'light',
  Lock = 'lock',
  Moisture = 'moisture',
  Motion = 'motion',
  Moving = 'moving',
  Occupancy = 'occupancy',
  Opening = 'opening',
  Plug = 'plug',
  Power = 'power',
  Presence = 'presence',
  Problem = 'problem',
  Safety = 'safety',
  Smoke = 'smoke',
  Sound = 'sound',
  Vibration = 'vibration',
  Window = 'window',
}

// https://www.home-assistant.io/integrations/binary_sensor.mqtt/#configuration-variables
export interface HABinarySensorConfig {
  availabilityTopic?: string;
  device?: DeviceInfo;
  deviceClass?: BinarySensorDeviceClass;
  expireAfter?: number;
  forceUpdate?: boolean;
  jsonAttributesTemplate?: Template;
  jsonAttributesTopic?: string;
  name?: string;
  offDelay?: number;
  payloadAvailable?: string;
  payloadUnavailable?: string;
  payloadOff?: string;
  payloadOn?: string;
  qos?: number;
  stateTopic: string;
  uniqueID?: string;
  valueTemplate?: Template;
}

function formatDeviceInfo(device: DeviceInfo | undefined): HADeviceInfo | undefined {
  if (!device) {
    return undefined;
  }
  const {
    connections,
    identifiers,
    manufacturer,
    model,
    name,
    firmwareVersion,
  } = device;

  return {
    connections,
    identifiers,
    manufacturer,
    model,
    name,
    sw_version: firmwareVersion,
  };
}

export function marshalBinarySensorConfig(config: HABinarySensorConfig): string {
  const {
    availabilityTopic: availability_topic,
    device,
    deviceClass: device_class,
    expireAfter: expire_after,
    forceUpdate: force_update,
    jsonAttributesTemplate: json_attributes_template,
    jsonAttributesTopic: json_attributes_topic,
    name,
    offDelay: off_delay,
    payloadAvailable: payload_available,
    payloadUnavailable: payload_not_available,
    payloadOff: payload_off,
    payloadOn: payload_on,
    qos,
    stateTopic: state_topic,
    uniqueID: unique_id,
    valueTemplate: value_template,
  } = config;

  return JSON.stringify({
    availability_topic,
    device: formatDeviceInfo(device),
    device_class: device_class === BinarySensorDeviceClass.None ? undefined : device_class,
    expire_after,
    force_update,
    json_attributes_template,
    json_attributes_topic,
    name,
    off_delay,
    payload_available,
    payload_not_available,
    payload_off,
    payload_on,
    qos,
    state_topic,
    unique_id,
    value_template,
  }, null, '  ');
}

// https://www.home-assistant.io/integrations/sensor/#device-class
export enum SensorDeviceClass {
  None = '',
  Battery = 'battery',
  Humidity = 'humidity',
  Illuminance = 'illuminance',
  SignalStrength = 'signal_strength',
  Temperature = 'temperature',
  Power = 'power',
  Pressure = 'pressure',
  Timestamp = 'timestamp',
}

// https://www.home-assistant.io/integrations/sensor.mqtt/#configuration-variables
export interface HASensorConfig {
  availabilityTopic?: string;
  device?: DeviceInfo;
  deviceClass?: SensorDeviceClass;
  expireAfter?: number;
  forceUpdate?: boolean;
  // https://cdn.materialdesignicons.com/4.5.95/
  icon?: string;
  jsonAttributesTemplate?: Template;
  jsonAttributesTopic?: string;
  name?: string;
  payloadAvailable?: string;
  payloadUnavailable?: string;
  qos?: number;
  stateTopic: string;
  uniqueID?: string;
  unitOfMeasurement?: string;
  valueTemplate?: Template;
}

export function marshalSensorConfig(config: HASensorConfig): string {
  const {
    availabilityTopic: availability_topic,
    device,
    deviceClass: device_class,
    expireAfter: expire_after,
    forceUpdate: force_update,
    icon,
    jsonAttributesTemplate: json_attributes_template,
    jsonAttributesTopic: json_attributes_topic,
    name,
    payloadAvailable: payload_available,
    payloadUnavailable: payload_not_available,
    qos,
    stateTopic: state_topic,
    uniqueID: unique_id,
    unitOfMeasurement: unit_of_measurement,
    valueTemplate: value_template,
  } = config;

  return JSON.stringify({
    availability_topic,
    device: formatDeviceInfo(device),
    device_class: device_class === SensorDeviceClass.None ? undefined : device_class,
    expire_after,
    force_update,
    icon,
    json_attributes_template,
    json_attributes_topic,
    name,
    payload_available,
    payload_not_available,
    qos,
    state_topic,
    unique_id,
    unit_of_measurement,
    value_template,
  }, null, '  ');
}

export interface HASwitchConfig {
  availabilityTopic?: string;
  commandTopic?: string;
  device?: DeviceInfo;
  icon?: string;
  jsonAttributesTemplate?: Template;
  jsonAttributesTopic?: string;
  name?: string;
  optimistic?: boolean;
  payloadAvailable?: string;
  payloadUnavailable?: string;
  payloadOff?: string;
  payloadOn?: string;
  qos?: number;
  retain?: boolean;
  stateOff?: string;
  stateOn?: string;
  stateTopic?: string;
  uniqueID?: string;
  valueTemplate?: Template;
}

export function marshalSwitchConfig(config: HASwitchConfig): string {
  const {
    availabilityTopic: availability_topic,
    commandTopic: command_topic,
    device,
    icon,
    jsonAttributesTemplate: json_attributes_template,
    jsonAttributesTopic: json_attributes_topic,
    name,
    optimistic,
    payloadAvailable: payload_available,
    payloadUnavailable: payload_not_available,
    payloadOff: payload_off,
    payloadOn: payload_on,
    qos,
    retain,
    stateOff: state_off,
    stateOn: state_on,
    stateTopic: state_topic,
    uniqueID: unique_id,
    valueTemplate: value_template,
  } = config;

  return JSON.stringify({
    availability_topic,
    command_topic,
    device: formatDeviceInfo(device),
    icon,
    json_attributes_template,
    json_attributes_topic,
    name,
    optimistic,
    payload_available,
    payload_not_available,
    payload_off,
    payload_on,
    qos,
    retain,
    state_off,
    state_on,
    state_topic,
    unique_id,
    value_template,
  }, null, '  ');
}

export enum DeviceTriggerType {
  ButtonShortPress = 'button_short_press',
  ButtonShortRelease = 'button_short_release',
  ButtonLongPress = 'button_long_press',
  ButtonLongRelease = 'button_long_release',
  ButtonDoublePress = 'button_double_press',
  ButtonTriplePress = 'button_triple_press',
  ButtonQuadruplePress = 'button_quadruple_press',
  ButtonQuintuplePress = 'button_quintuple_press',
}

export enum DeviceTriggerSubtype {
  TurnOn = 'turn_on',
  TurnOff = 'turn_off',
  Button1 = 'button_1',
  Button2 = 'button_2',
  Button3 = 'button_3',
  Button4 = 'button_4',
  Button5 = 'button_5',
  Button6 = 'button_6',
}

// https://www.home-assistant.io/integrations/device_trigger.mqtt/
export interface HADeviceTriggerConfig {
  payload?: string;
  qos?: number;
  topic: string;
  type: DeviceTriggerType;
  subtype: DeviceTriggerSubtype;
  device: DeviceInfo;
  uniqueID?: string;
}

export function marshalDeviceTriggerConfig(config: HADeviceTriggerConfig): string {
  const {
    payload,
    qos,
    topic,
    type,
    subtype,
    device,
    uniqueID: unique_id,
  } = config;

  return JSON.stringify({
    automation_type: 'trigger',
    payload,
    qos,
    topic,
    type,
    subtype,
    device: formatDeviceInfo(device),
    unique_id,
  }, null, '  ');
}

export function getDiscoveryTopic(componentType: ComponentType, nodeID: string, objectID: string): string {
  return `homeassistant/${componentType}/${nodeID}/${objectID}/config`;
}
