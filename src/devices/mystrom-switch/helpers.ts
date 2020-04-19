import {
  SensorType,
  RelayState,
} from './types';

export function getSensorKey(type: SensorType): string {
  switch (type) {
    case SensorType.Power:
      return 'power';
    case SensorType.Temperature:
      return 'temperature';
    case SensorType.Relay:
      return 'relay';
    case SensorType.RelayCommand:
      return 'relay_command';
    case SensorType.Availability:
      return 'available';
    default:
      throw new Error(`Unknown sensor type '${type}'`);
  }
}

export function getRelayStateValue(relayState: RelayState): string {
  switch (relayState) {
    case RelayState.On:
      return 'on';
    case RelayState.Off:
      return 'off';
    default:
      throw new Error(`Unknown relay state '${relayState}'`);
  }
}

export function getRelayStateByValue(value: string): RelayState | undefined {
  switch (value) {
    case 'on':
      return RelayState.On;
    case 'off':
      return RelayState.Off;
    default:
      return undefined;
  }
}
