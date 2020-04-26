import type { PluginOptions } from 'server/plugin-manager';

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
