import type { PluginOptions } from 'server/plugin-manager';

export enum RelayState {
  Off = '0',
  On = '1',
}

export enum SensorType {
  Power = 'power',
  Temperature = 'temperature',
  Relay = 'relay',
  RelayCommand = 'relay_command',
  Availability = 'availability',
}

export enum Availability {
  Online = 'online',
  Offline = 'offline',
}

export interface SwitchConfig {
  host: string;
  name: string;
}

export interface MyStromSwitchPluginOptions extends PluginOptions {
  pollingInterval: number;
  sensorUpdateInterval: number;
  mqttTopic: string;
  switches: SwitchConfig[];
}

export interface SwitchInfo {
  mac: string;
  ip: string;
  version: string;
  type: string;
  name: string;
}

export interface SwitchReport {
  [SensorType.Relay]: RelayState;
  [SensorType.Power]: number;
  [SensorType.Temperature]: number;
}

export interface SwitchDetails {
  name: string;
  host: string;
  mac: string;
  ip: string;
  deviceName: string;
  deviceType: string;
  firmwareVersion: string;
}
