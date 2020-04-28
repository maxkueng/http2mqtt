import mystromButtonsPlugin from 'devices/mystrom-buttons';
import mystromSwitchPlugin from 'devices/mystrom-switch';
import edimaxPlugPlugin from 'devices/edimax-plug';
import shellySwitchPlugin from 'devices/shelly-switch';
import type { Plugin } from 'server/plugin-manager';

interface Registration {
  name: string;
  plugin: Plugin;
}

const plugins: Plugin[] = [
  mystromButtonsPlugin,
  mystromSwitchPlugin,
  edimaxPlugPlugin,
  shellySwitchPlugin,
];

export default plugins;
