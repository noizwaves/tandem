import {MouseButton} from './mouse';

export interface CursorMover {
  move(x: number, y: number): void;
  buttonDown(x: number, y: number, button: MouseButton): void;
  buttonUp(x: number, y: number, button: MouseButton): void;
  doubleClick(x: number, y: number, button: MouseButton): void;
  scroll(xDelta: number, yDelta: number);
}
