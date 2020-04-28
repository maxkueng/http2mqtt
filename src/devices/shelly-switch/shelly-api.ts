import querystring from 'querystring';
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

export enum RelayState {
  Off = 'off',
  On = 'on',
}

export enum SensorType {
  Power = 'power',
  Temperature = 'temperature',
  Relay = 'relay',
  RelayCommand = 'relay_command',
  Availability = 'availability',
}

export enum Availability {
  Online = 'online',
  Offline = 'offline',
}

export interface SwitchInfo {
  mac: string;
  ip: string;
  version: string;
  type: string;
  name: string;
}

export interface SwitchReport {
  [SensorType.Relay]: RelayState;
  [SensorType.Power]?: number | undefined;
  [SensorType.Temperature]?: number | undefined;
}

export interface Options {
  host: string;
  username?: string | undefined;
  password?: string | undefined;
}

interface ShellySettings {
  mac: string;
  model: string;
  firmwareVersion: string;
}

interface ShellyStatus {
  ip: string;
  relayState: RelayState;
  pcbTemperature: number;
  power: number | undefined;
}

function getDefaultRequestOptions(options: Options): AxiosRequestConfig {
  const {
    username,
    password,
  } = options;
  const auth = username && password
    ? {
      username,
      password,
    }
    : undefined;
  return {
    responseType: 'json',
    auth,
  };
}

function getRelayStateValue(relayState: RelayState): string {
  switch (relayState) {
    case RelayState.Off:
      return 'off';
    case RelayState.On:
      return 'on';
    default:
      throw new Error(`Unknown relay state '${relayState}'`);
  }
}

function getURL(host: string, pathname: string): string {
  return `http://${host}${pathname}`;
}

async function getSettings(options: Options): Promise<ShellySettings> {
  const response = await axios.get(getURL(options.host, '/settings'), { ...getDefaultRequestOptions(options) });
  const { data } = response;
  const {
    device,
    fw,
  } = data;

  return {
    mac: device.mac,
    model: device.type,
    firmwareVersion: fw,
  } as ShellySettings;
}

async function getStatus(options: Options): Promise<ShellyStatus> {
  const response = await axios.get(getURL(options.host, '/status'), { ...getDefaultRequestOptions(options) });
  const { data } = response;
  const {
    wifi_sta: wifi,
    relays,
    meters,
    temperature,
  } = data;
  const [relay] = relays;

  const relayState = relay.ison === true ? RelayState.On : RelayState.Off;
  const meter = Array.isArray(meters) ? meters[0] : undefined;

  return {
    ip: wifi.ip,
    relayState,
    pcbTemperature: temperature,
    power: meter && meter.power,
  } as ShellyStatus;
}

export async function getInfo(options: Options): Promise<SwitchInfo> {
  const [
    settings,
    status,
  ] = await Promise.all([
    getSettings(options),
    getStatus(options),
  ]);

  const info: SwitchInfo = {
    mac: settings.mac,
    ip: status.ip,
    name: settings.model,
    version: settings.firmwareVersion,
    type: settings.model,
  };

  return info;
}

export async function getReport(options: Options): Promise<SwitchReport> {
  const status = await getStatus(options);

  return {
    [SensorType.Relay]: status.relayState,
    [SensorType.Power]: status.power,
    [SensorType.Temperature]: status.pcbTemperature,
  };
}

export async function setRelayState(options: Options, relayState: RelayState): Promise<void> {
  await axios.post(
    getURL(options.host, '/relay/0'),
    querystring.stringify({ turn: getRelayStateValue(relayState) }),
    {
      ...getDefaultRequestOptions(options),
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
    },
  );
}
