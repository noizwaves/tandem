export interface CursorMover {
  move(x: number, y: number): void;
  buttonDown(x: number, y: number, button: ButtonType): void;
  buttonUp(x: number, y: number, button: ButtonType): void;
  scroll(xDelta: number, yDelta: number);
}

export enum ButtonType {LEFT, MIDDLE, RIGHT};
