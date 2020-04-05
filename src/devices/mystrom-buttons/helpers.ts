import {
  ActionID,
  ActionName,
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
