/* eslint-disable @typescript-eslint/camelcase */

export enum ComponentType {
  Sensor = 'sensor',
  BinarySensor = 'binary_sensor',
}

export type Template = string;

export interface DeviceInfo {
  connections?: [string, string | number][];
  identifiers?: string[];
  manufacturer?: string;
  model?: string;
  name?: string;
  firmwareVersion?: string;
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
export interface BinarySensorConfig {
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

export function marshalBinarySensorConfig(config: BinarySensorConfig): string {
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
    device,
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
export interface SensorConfig {
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

export function marshalSensorConfig(config: SensorConfig): string {
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
    device,
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

export function getDiscoveryTopic(componentType: ComponentType, nodeID: string, objectID: string): string {
  return `homeassistant/${componentType}/${nodeID}/${objectID}/config`;
}
