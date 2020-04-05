import mystromButtonsPlugin from 'devices/mystrom-buttons';
import type { Plugin } from 'server/plugin-manager';

interface Registration {
  name: string;
  plugin: Plugin;
}

const plugins: Plugin[] = [
  mystromButtonsPlugin,
];

export default plugins;
