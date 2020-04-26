import mystromButtonsPlugin from 'devices/mystrom-buttons';
import mystromSwitchPlugin from 'devices/mystrom-switch';
import edimaxPlugPlugin from 'devices/edimax-plug';
import type { Plugin } from 'server/plugin-manager';

interface Registration {
  name: string;
  plugin: Plugin;
}

const plugins: Plugin[] = [
  mystromButtonsPlugin,
  mystromSwitchPlugin,
  edimaxPlugPlugin,
];

export default plugins;
