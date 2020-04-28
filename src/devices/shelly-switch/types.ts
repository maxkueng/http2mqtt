import type { PluginOptions } from 'server/plugin-manager';

export enum DeviceType {
  Shelly1 = 'shelly-1',
  Shelly1PM = 'shelly-1pm',
}

export interface SwitchConfig {
  type: DeviceType;
  host: string;
  name: string;
  username?: string | undefined;
  password?: string | undefined;
}

export interface ShellyPluginOptions extends PluginOptions {
  pollingInterval: number;
  sensorUpdateInterval: number;
  mqttTopic: string;
  switches: SwitchConfig[];
}
