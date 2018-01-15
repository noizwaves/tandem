import {ActuatorFactory} from '../domain/actuator-factory';
import {CursorMover} from '../domain/cursor-mover';
import {KeyPresser} from '../domain/key-presser';
import {RobotCursorMover} from './robot-cursor-mover';
import {RobotKeyPresser} from './robot-key-presser';

export class RobotActuatorFactory implements ActuatorFactory {
  getCursorMover(): CursorMover {
    return new RobotCursorMover();
  }

  getKeyPresser(): KeyPresser {
    return new RobotKeyPresser();
  }
}
