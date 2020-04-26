import type { PluginOptions } from 'server/plugin-manager';

export interface SwitchConfig {
  host: string;
  name: string;
  username: string;
  password: string;
}

export interface EdimaxPlugPluginOptions extends PluginOptions {
  pollingInterval: number;
  sensorUpdateInterval: number;
  mqttTopic: string;
  switches: SwitchConfig[];
}
