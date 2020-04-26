import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

export enum RelayState {
  Off = '0',
  On = '1',
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
  [SensorType.Power]: number;
  [SensorType.Temperature]: number;
}

const defaultRequestOptions: AxiosRequestConfig = { responseType: 'json' };

function getURL(host: string, pathname: string): string {
  return `http://${host}${pathname}`;
}

export async function getInfo(host: string): Promise<SwitchInfo> {
  const response = await axios.get(getURL(host, '/info'), { ...defaultRequestOptions });
  const { data } = response;

  const info: SwitchInfo = {
    mac: data.mac,
    ip: data.ip,
    name: data.name,
    version: data.version,
    type: data.type,
  };

  return info;
}

export async function getReport(host: string): Promise<SwitchReport> {
  const response = await axios.get(getURL(host, '/report'), { ...defaultRequestOptions });
  const { data } = response;

  const report: SwitchReport = {
    [SensorType.Relay]: data.relay === true ? RelayState.On : RelayState.Off,
    [SensorType.Power]: data.power,
    [SensorType.Temperature]: data.temperature,
  };

  return report;
}

export async function toggle(host: string): Promise<RelayState> {
  const response = await axios.get(getURL(host, '/toggle'), { ...defaultRequestOptions });
  const { data } = response;

  if (data.relay === true) {
    return RelayState.On;
  }

  return RelayState.Off;
}

export async function setRelayState(host: string, state: RelayState): Promise<RelayState> {
  await axios.get(getURL(host, '/relay'), {
    ...defaultRequestOptions,
    params: { state },
  });
  return state;
}

export function turnOn(host: string): Promise<RelayState> {
  return setRelayState(host, RelayState.On);
}

export function turnOf(host: string): Promise<RelayState> {
  return setRelayState(host, RelayState.Off);
}
