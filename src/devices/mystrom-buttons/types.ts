import type { PluginOptions } from 'server/plugin-manager';

export enum ActionID {
  Single = '1',
  Double = '2',
  Long = '3',
  Touch = '4',
  Wheel = '5',
  Battery = '6',
  WheelFinal = '11',
}

export enum ActionName {
  Single = 'single',
  Double = 'double',
  Long = 'long',
  Touch = 'touch',
  Wheel = 'wheel',
  Battery = 'battery',
  WheelFinal = 'wheel_final',
}

export enum ButtonType {
  Button = 'button',
  ButtonPlus = 'button-plus',
}

export interface ButtonLightConfig {
  type: ButtonType.Button;
  mac: string;
  name: string;
}

export interface ButtonPlusConfig {
  type: ButtonType.ButtonPlus;
  mac: string;
  name: string;
  wheelMax: number;
  wheelMin: number;
  wheelSpeed: number;
}

export type ButtonConfig =
  | ButtonLightConfig
  | ButtonPlusConfig
  ;


export interface MyStromButtonPluginOptions extends PluginOptions {
  mqttTopic: string;
  buttons: ButtonConfig[];
}
