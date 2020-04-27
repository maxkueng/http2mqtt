/* eslint-disable no-console */

import * as yargs from 'yargs';
import Server from 'server/server';
import { getConfig } from 'server/config';
import devices from 'devices';

console.log(`Commit: ${__COMMIT_HASH__}`);

const args = yargs.options({
  config: {
    type: 'string',
    default: './config.json',
  },
}).argv;

async function run(): Promise<void> {
  const config = getConfig(args.config);
  const server = new Server({ config });

  devices.forEach((plugin) => {
    const options = config.options[plugin.name];
    if (options) {
      server.plugins.register(plugin.name, plugin, options);
    }
  });

  await server.start();
}

process.on('unhandledRejection', (err) => {
  // eslint-disable-next-line no-console
  console.error('unhandledRejection', err);
  process.exit(1);
});

run();
