import {
  RelayState,
  Availability,
  SensorType,
} from './types';

export function getSensorKey(sensorType: SensorType): string {
  switch (sensorType) {
    case SensorType.Temperature:
      return 'temperature';
    case SensorType.Power:
      return 'power';
    case SensorType.Amperage:
      return 'amperage';
    case SensorType.Relay:
      return 'relay';
    case SensorType.RelayCommand:
      return 'relay_command';
    case SensorType.Availability:
      return 'available';
    default:
      throw new Error(`Unknown sensor type '${sensorType}'`);
  }
}

export function getSensorFriendlyName(sensorType: SensorType): string {
  switch (sensorType) {
    case SensorType.Temperature:
      return 'Temperature';
    case SensorType.Power:
      return 'Power';
    case SensorType.Amperage:
      return 'Amperage';
    case SensorType.Relay:
      return 'Relay';
    case SensorType.RelayCommand:
      return 'Relay Command';
    case SensorType.Availability:
      return 'Availability';
    default:
      throw new Error(`Unknown sensor type '${sensorType}'`);
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

export function getAvailabilityValue(availability: Availability): 'online' | 'offline' {
  switch (availability) {
    case Availability.Online:
      return 'online';
    case Availability.Offline:
      return 'offline';
    default:
      throw new Error(`Unknown availability '${availability}'`);
  }
}
