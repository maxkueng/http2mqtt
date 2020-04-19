import path from 'path';
import fs from 'fs-extra';
import express, { Application } from 'express';
import cors from 'cors';
import LogManager from 'server/logger';
import PluginManager from 'server/plugin-manager';
import MqttClient from 'server/mqtt-client';

import type { Logger } from 'winston';
import type { Configuration } from 'server/config';

interface ServerOptions {
  config: Configuration;
}

export default class Server {
  logging: LogManager;

  logger: Logger;

  plugins: PluginManager;

  config: Configuration;

  app: Application;

  mqttClient: MqttClient;

  constructor({ config }: ServerOptions) {
    this.config = config;
    this.logging = new LogManager(config.logLevel);
    this.logger = this.logging.getLogger('server');
    this.mqttClient = new MqttClient(config.mqtt);
    this.app = express();
    this.plugins = new PluginManager(this);

    if (config.http.cors) {
      this.app.use(cors(typeof config.http.cors === 'object' ? config.http.cors : undefined));
    }
  }

  startHttpServer(): Promise<void> {
    const { http: httpConfig } = this.config;
    return new Promise((resolve) => {
      this.app.listen(httpConfig.port, httpConfig.host, () => {
        this.logger.info(`http.listening on ${httpConfig.host}:${httpConfig.port}`);
        resolve();
      });
    });
  }

  async getDataDir(moduleID?: string): Promise<string> {
    const dir = path.resolve(this.config.dataDir);

    if (moduleID) {
      const moduleDir = path.join(dir, moduleID);
      fs.ensureDirSync(moduleDir);
      return moduleDir;
    }
    return dir;
  }

  registerApp(route: string, app: Application): void {
    this.app.use(route, app);
  }

  async start(): Promise<void> {
    await this.mqttClient.connect();
    await this.startHttpServer();
    await this.plugins.initializePlugins();
  }
}
