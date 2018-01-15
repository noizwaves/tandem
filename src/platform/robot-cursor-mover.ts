import * as robot from 'robotjs';

import {CursorMover} from '../domain/cursor-mover';
import {MouseButton} from '../domain/mouse';
import {getLogger} from '../logging';

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

    if (!this._buttonDown) {
      logger.debug(`[RobotCursorMover] move to rel(${x},${y}) abs(${moveX},${moveY})`);
      robot.moveMouse(moveX, moveY);
    } else {
      logger.debug(`[RobotCursorMover] drag to rel(${x},${y}) abs(${moveX},${moveY})`);
      robot.dragMouse(moveX, moveY);
    }
  }

  buttonDown(x: number, y: number, button: MouseButton): void {
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

  buttonUp(x: number, y: number, button: MouseButton): void {
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

  doubleClick(x: number, y: number, button: MouseButton): void {
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

  private static toRobotButtonString(button: MouseButton) {
    switch (button) {
      case MouseButton.LEFT:
        return 'left';
      case MouseButton.MIDDLE:
        return 'middle';
      case MouseButton.RIGHT:
        return 'right';
      default:
        throw new Error(`Unhandled ButtonType '${button}'`);
    }
  }
}
