import path from 'path';
import fs from 'fs';
import Joi from '@hapi/joi';
import * as validationHelpers from 'helpers/validation';
import Logger from 'server/logger';
import type { CorsOptions } from 'cors';
import type { PluginOptions } from 'server/plugin-manager';

export interface HttpConfiguration {
  host: string;
  port: number;
  cors?: boolean | CorsOptions;
}

export interface MqttConfiguration {
  broker: string;
  username?: string;
  password?: string;
}

interface PluginConfigurations {
  [key: string]: PluginOptions;
}

interface HomeAssistantConfiguration {
  discovery?: boolean;
}

export interface Configuration {
  logLevel: string;
  dataDir: string;
  http: HttpConfiguration;
  mqtt: MqttConfiguration;
  homeAssistant?: HomeAssistantConfiguration;
  options: PluginConfigurations;
}

const defaultConfig = {
  logLevel: 'info',
  dataDir: './data',
  http: {
    host: '0.0.0.0',
    port: 8321,
  },
};

const httpSchema = Joi.object({
  host: Joi.string().required().ip(),
  port: Joi.number().required().min(0).max(65535),
});

const mqttSchema = Joi.object({
  broker: Joi.string().required().uri(),
  username: Joi.string().optional(),
  password: Joi.string().when('username', {
    is: Joi.string().required(),
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
});

const homeAssistantSchema = Joi.object({ discovery: Joi.boolean().truthy('yes').falsy('no').optional() });

const configSchema = Joi.object({
  logLevel: Joi.string().required().valid('error', 'warn', 'info', 'verbose', 'debug', 'silly'),
  dataDir: Joi.string().required(),
  http: httpSchema.required(),
  mqtt: mqttSchema.required(),
  homeAssistant: homeAssistantSchema.optional(),
  options: Joi.object().optional(),
});

export function getConfig(configPath: string): Configuration {
  const logger = new Logger().getLogger('config');
  logger.info(`Config oath ${configPath}`);
  const resolvedPath = path.resolve(configPath);
  const fileContents = fs.readFileSync(resolvedPath, 'utf-8');
  const configFile = JSON.parse(fileContents);
  logger.debug('Config', JSON.stringify(configFile, null, '  '));

  const config = {
    ...defaultConfig,
    ...configFile,
    http: {
      ...defaultConfig.http,
      ...configFile.http,
    },
  };

  return validationHelpers.validate<Configuration>(configSchema, config);
}
