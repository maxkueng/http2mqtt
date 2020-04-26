import type { PluginOptions } from 'server/plugin-manager';

export enum SensorType {
  Temperature = 'sensor-type/temperature',
  Power = 'sensor-type/power',
  Amperage = 'sensor-type/amperage',
  Relay = 'sensor-type/relay',
  RelayCommand = 'sensor-type/relay_command',
  Availability = 'sensor-type/availability',
}

export enum RelayState {
  On = 'relay-state/on',
  Off = 'relay-state/off',
}

export enum Availability {
  Online = 'availability/online',
  Offline = 'availability/offline',
}

/*
export interface SwitchConfig {
  host: string;
  name: string;
  username?: string;
  password?: string;
}
*/

export interface SwitchInfo {
  mac: string;
  ip: string;
  version: string;
  type: string;
  name: string;
}

export interface SensorReport {
  [SensorType.Relay]: RelayState;
  [SensorType.Power]?: number;
  [SensorType.Amperage]?: number;
  [SensorType.Temperature]?: number;
}

export interface SwitchDetails {
  name: string;
  host: string;
  mac: string;
  ip?: string;
  deviceName: string;
  deviceType: string;
  deviceManufacturer: string;
  firmwareVersion?: string;
}

export interface SwitchClient {
  getSwitchIDs: () => string[];
  getSwitchDetails: (switchID: string) => Promise<SwitchDetails | undefined>;
  getSensorTypes: (switchID: string) => SensorType[];
  getSensorReport: (switchID: string) => Promise<SensorReport | undefined>;
  setRelayState: (switchID: string, relayState: RelayState) => Promise<void>;
}

export interface BaseSwitchOptions extends PluginOptions {
  pollingInterval: number;
  sensorUpdateInterval: number;
  mqttTopic: string;
  client: SwitchClient;
  // switches: SwitchConfig[];
}
