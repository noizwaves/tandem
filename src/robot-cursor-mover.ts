import * as robot from 'robotjs';

import {ButtonType, CursorMover} from './cursor-mover';
import {getLogger} from './logging';

const logger = getLogger();

export class RobotCursorMover implements CursorMover {
  private _buttonDown: boolean;
  constructor() {
    this._buttonDown = false;

    logger.debug(`[RobotCursorMover] screen has height:${screen.height} width:${screen.width}`);
  }

  move(x: number, y: number): void {
    const moveX = Math.round(x * screen.width);
    const moveY = Math.round(y * screen.height);

    logger.debug(`[RobotCursorMover] move to rel(${x},${y}) abs(${moveX},${moveY})`);

    if (!this._buttonDown) {
      robot.moveMouse(moveX, moveY);
    } else {
      robot.dragMouse(moveX, moveY);
    }
  }

  buttonDown(x: number, y: number, button: ButtonType): void {
    logger.debug(`[RobotCursorMover] mouseDown of button '${button.toString()}'`);

    let robotButton: string = null;
    try {
      robotButton = RobotCursorMover.toRobotButtonString(button);
    } catch (e) {
      logger.error(`[RobotCursorMover] Failed to get robot button type: ${e.message}`);
      return;
    }

    robot.moveMouse(Math.round(x * screen.width), Math.round(y * screen.height));
    robot.mouseToggle('down', robotButton);

    this._buttonDown = true;
  }

  buttonUp(x: number, y: number, button: ButtonType): void {
    logger.debug(`[RobotCursorMover] mouseUp of button '${button.toString()}'`);

    let robotButton: string = null;
    try {
      robotButton = RobotCursorMover.toRobotButtonString(button);
    } catch (e) {
      logger.error(`[RobotCursorMover] Failed to get robot button type: ${e.message}`);
      return;
    }

    robot.moveMouse(Math.round(x * screen.width), Math.round(y * screen.height));
    robot.mouseToggle('up', robotButton);

    this._buttonDown = false;
  }

  doubleClick(x: number, y: number, button: ButtonType): void {
    logger.debug(`[RobotCursorMover] double click of button '${button.toString()}'`);

    let robotButton: string = null;
    try {
      robotButton = RobotCursorMover.toRobotButtonString(button);
    } catch (e) {
      logger.error(`[RobotCursorMover] Failed to get robot button type: ${e.message}`);
      return;
    }

    robot.moveMouse(Math.round(x * screen.width), Math.round(y * screen.height));
    robot.mouseClick(robotButton, true);
  }

  scroll(xDelta: number, yDelta: number) {
    robot.scrollMouse(xDelta, yDelta);
  }

  private static toRobotButtonString(button: ButtonType) {
    switch (button) {
      case ButtonType.LEFT:
        return 'left';
      case ButtonType.MIDDLE:
        return 'middle';
      case ButtonType.RIGHT:
        return 'right';
      default:
        throw new Error(`Unhandled ButtonType '${button}'`);
    }
  }
}
