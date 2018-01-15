import {CursorMover} from './cursor-mover';
import {KeyPresser} from './key-presser';

export interface ActuatorFactory {
  getCursorMover(): CursorMover;
  getKeyPresser(): KeyPresser;
}
