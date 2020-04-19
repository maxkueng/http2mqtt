import {
  ActionID,
  ActionName,
  BinarySensorState,
} from './types';

export function getActionName(actionID: ActionID): ActionName {
  switch (actionID) {
    case ActionID.Single:
      return ActionName.Single;
    case ActionID.Double:
      return ActionName.Double;
    case ActionID.Long:
      return ActionName.Long;
    case ActionID.Touch:
      return ActionName.Touch;
    case ActionID.Wheel:
      return ActionName.Wheel;
    case ActionID.Battery:
      return ActionName.Battery;
    case ActionID.WheelFinal:
      return ActionName.WheelFinal;
    default:
      throw new Error(`Invalid action id '${actionID}'`);
  }
}

export function getBinarySensorStateValue(sensorState: BinarySensorState): string {
  switch (sensorState) {
    case BinarySensorState.On:
      return 'on';
    case BinarySensorState.Off:
      return 'off';
    default:
      throw new Error(`Uknown sensor state '${sensorState}'`);
  }
}
