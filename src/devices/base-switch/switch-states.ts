import {
  RelayState,
  Availability,
} from './types';

interface SwitchState {
  availability: Availability | undefined;
  relay: RelayState | undefined;
}

export default class SwitchStates {
  states: { [key: string]: SwitchState } = {};

  ensureEntry(key: string): void {
    if (!this.states[key]) {
      this.states[key] = {
        availability: undefined,
        relay: undefined,
      };
    }
  }

  setAvailability(key: string, availability: Availability): void {
    this.ensureEntry(key);

    this.states[key] = {
      ...this.states[key],
      availability,
    };
  }

  getAvailability(key: string): Availability | undefined {
    this.ensureEntry(key);
    return this.states[key].availability;
  }

  isAvailable(key: string): boolean {
    return this.states[key]?.availability === Availability.Online;
  }

  setRelay(key: string, relay: RelayState): void {
    this.ensureEntry(key);

    this.states[key] = {
      ...this.states[key],
      relay,
    };
  }

  getRelay(key: string): RelayState | undefined {
    this.ensureEntry(key);
    return this.states[key].relay;
  }

  isRelayOn(key: string): boolean {
    return this.states[key]?.relay === RelayState.On;
  }
}
