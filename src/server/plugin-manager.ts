import type Server from 'server/server';
import type { Configuration } from 'server/config';
import type { Logger } from 'winston';
import type { Application } from 'express';
import type MqttClient from 'server/mqtt-client';

export interface Plugin {
  name: string;
  version: string;
  initialize: (
    pluginInterface: PluginInterface,
    options: PluginOptions,
  ) => Promise<void>;
}

export type PluginOptions = {
  route?: string | undefined;
};

export interface PluginInterface {
  config: Configuration;
  logger: Logger;
  getDataDir: () => Promise<string>;
  registerApp: (app: Application, route?: string | undefined) => void;
  mqttClient: MqttClient;
}

export interface PluginRegistration {
  id: string;
  name: string;
  version: string;
  initialize: (pluginInterface: PluginInterface, options: PluginOptions) => Promise<void>;
  options: PluginOptions;
}

interface PluginRegistrations {
  [id: string]: PluginRegistration;
}

export default class PluginManager {
  logger: Logger;

  plugins: PluginRegistrations = {};

  server: Server;

  constructor(server: Server) {
    this.server = server;
    this.logger = server.logging.getLogger('plugin-manager');
  }

  register(id: string, plugin: Plugin, options: PluginOptions = {}): void {
    this.plugins[id] = {
      id,
      name: plugin.name,
      version: plugin.version,
      initialize: plugin.initialize,
      options,
    };
  }

  async initializePlugins(): Promise<void> {
    await Promise.all(
      Object.values(this.plugins).map((plugin) => {
        if (!this.server.mqttClient) {
          throw new Error('MQTT client not initialized');
        }

        const pluginInfo = {
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
        };
        this.logger.debug('plugin.initialize', { plugin: pluginInfo });

        const pluginInterface = {
          config: this.server.config,
          logger: this.server.logging.getLogger(`plugin:${plugin.id}`),
          getDataDir: (): Promise<string> => this.server.getDataDir(`plugin_${plugin.id}`),
          registerApp: (app: Application, route: string | undefined = `/${plugin.id}`): void => (
            this.server.registerApp(route, app)
          ),
          mqttClient: this.server.mqttClient,
        };

        let init;
        try {
          init = plugin.initialize(pluginInterface, plugin.options);
          this.logger.info('plugin.initialized', { plugin: pluginInfo });
        } catch (err) {
          this.logger.error('pluginManager.plugin.initialize_failed', {
            plugin: pluginInfo, error: err,
          });
          process.exit(1);
        }
        return init;
      }),
    );
  }
}
