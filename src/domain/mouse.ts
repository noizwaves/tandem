import * as Rx from 'rxjs';

import {getLogger} from '../logging';


export enum MouseButton {LEFT, MIDDLE, RIGHT};

export enum MouseButtonDirection {UP, DOWN};

export interface MouseButtonEvent {
  x: number;
  y: number;
  width: number;
  height: number;
  button: MouseButton;
  direction: MouseButtonDirection;
}

export interface DoubleClickEvent {
  x: number;
  y: number;
  width: number;
  height: number;
  button: MouseButton;
}

export interface MouseButtonDetector {
  readonly up: Rx.Observable<MouseButtonEvent>;
  readonly down: Rx.Observable<MouseButtonEvent>;
  readonly double: Rx.Observable<DoubleClickEvent>;

  dispose(): void;
}

