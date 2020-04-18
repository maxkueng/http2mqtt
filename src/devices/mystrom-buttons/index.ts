import Joi from '@hapi/joi';
import express from 'express';
import { createValidator } from 'express-joi-validation';
import * as validationHelpers from 'helpers/validation';
import type {
  ContainerTypes,
  ValidatedRequest,
  ValidatedRequestSchema,
} from 'express-joi-validation';
import type {
  PluginOptions,
  PluginInterface,
} from 'server/plugin-manager';
import * as helpers from './helpers';
import discovery from './discovery';
import {
  ActionID,
  ButtonType,
} from './types';
import type {
  ButtonConfig,
  MyStromButtonPluginOptions,
} from './types';

const sleep = (duration = 1000): Promise<void> => (new Promise((resolve) => setTimeout(resolve, duration)));

interface WheelStates {
  [mac: string]: number;
}

const buttonConfigSchema = Joi.object({
  mac: validationHelpers.macAddressSchema().required(),
  name: Joi.string().required().min(3).max(32),
  type: Joi.string().required().valid(...Object.values(ButtonType)),
  wheelMin: Joi.number().when('type', {
    is: Joi.string().required().valid(ButtonType.ButtonPlus),
    then: Joi.number().required(),
    otherwise: Joi.forbidden(),
  }),
  wheelMax: Joi.number().when('type', {
    is: Joi.string().required().valid(ButtonType.ButtonPlus),
    then: Joi.number().required(),
    otherwise: Joi.forbidden(),
  }),
  wheelSpeed: Joi.number().when('type', {
    is: Joi.string().required().valid(ButtonType.ButtonPlus),
    then: Joi.number().optional().default(1),
    otherwise: Joi.forbidden(),
  }),
});

const optionsSchema = Joi.object({
  route: Joi.string().optional(),
  mqttTopic: Joi.string().required(),
  buttons: Joi.array().items(buttonConfigSchema),
});

const querySchema = Joi.object({
  mac: validationHelpers.macAddressSchema().required(),
  action: Joi.string().required().valid(...Object.values(ActionID)),
  battery: Joi.number().required().min(0).max(100),
  wheel: Joi.number().when('action', {
    is: Joi.string().required().valid(ActionID.Wheel),
    then: Joi.number().required().min(-127).max(127),
    otherwise: Joi.forbidden(),
  }),
});

export default {
  name: 'mystrom-buttons',
  version: '1.0.0',
  initialize(
    plugin: PluginInterface,
    options: PluginOptions = {},
  ): Promise<void> {
    const defaultOptions = { mqttTopic: 'mystrom/wifi_buttons' };
    const opts = validationHelpers.validate<MyStromButtonPluginOptions>(
      optionsSchema,
      {
        ...defaultOptions,
        ...options,
      },
    );

    const {
      config,
      logger,
      registerApp,
      mqttClient,
    } = plugin;

    const {
      route,
      buttons,
    } = opts;


    const getActionTopic = (button: ButtonConfig, actionID: ActionID): string => {
      const actionName = helpers.getActionName(actionID);
      return `${opts.mqttTopic}/${button.mac}/${actionName}`;
    };

    const wheelStates: WheelStates = buttons.reduce((states, button) => {
      if (button.type === ButtonType.ButtonPlus) {
        return {
          ...states,
          [button.mac]: 0,
        };
      }
      return states;
    }, {});

    const handleRegularAction = async (
      mac: string,
      actionID: ActionID,
      battery: number,
    ): Promise<void> => {
      const currentButton = buttons.find((button: ButtonConfig) => button.mac === mac);
      if (currentButton) {
        mqttClient.publish(getActionTopic(currentButton, ActionID.Battery), String(battery), {
          retain: true,
          qos: 0,
        });
        mqttClient.publish(getActionTopic(currentButton, actionID), 'ON');
        await sleep(1000);
        mqttClient.publish(getActionTopic(currentButton, actionID), 'OFF');
      }
    };

    const handleWheelAction = (
      mac: string,
      wheel: number,
      battery: number,
    ): void => {
      const currentButton = buttons.find((button: ButtonConfig) => button.mac === mac);
      if (currentButton && currentButton.type === ButtonType.ButtonPlus) {
        if (typeof wheelStates[mac] !== 'undefined') {
          const wheelValue = Math.min(
            currentButton.wheelMax,
            Math.max(
              currentButton.wheelMin,
              wheelStates[mac] + (wheel * currentButton.wheelSpeed),
            ),
          );
          wheelStates[mac] = wheelValue;

          mqttClient.publish(getActionTopic(currentButton, ActionID.Battery), String(battery), { retain: true });
          mqttClient.publish(getActionTopic(currentButton, ActionID.Wheel), String(wheelValue), { retain: true });
        }
      }
    };

    const app = express();
    const validator = createValidator();

    interface ButtonActionRequestSchema extends ValidatedRequestSchema {
      [ContainerTypes.Query]: {
        mac: string;
        action: ActionID;
        battery: number;
        wheel?: number;
      };
    }

    app.get(
      '/',
      validator.query(querySchema),
      (req: ValidatedRequest<ButtonActionRequestSchema>, res) => {
        const {
          mac,
          action,
          wheel,
          battery,
        } = req.query;

        const currentButton = buttons.find((button: ButtonConfig) => button.mac === mac);
        if (!currentButton) {
          res.status(401).send('Unauthorized');
          return;
        }

        switch (action) {
          case ActionID.Wheel:
            handleWheelAction(mac, typeof wheel === 'number' ? wheel : 0, battery);
            break;
          default:
            handleRegularAction(mac, action, battery);
        }

        res.status(200).send('OK');
      },
    );

    registerApp(app, route);

    logger.info('Initialize', opts);

    if (config.homeAssistant && config.homeAssistant.discovery) {
      const discover = discovery(plugin, opts);
      discover.announceButtons(buttons);
    }

    return Promise.resolve();
  },
};
