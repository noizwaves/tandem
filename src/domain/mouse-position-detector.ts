import * as Rx from 'rxjs/Rx';

export interface MousePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MousePositionDetector {
  readonly position: Rx.Observable<MousePosition>;

  dispose(): void;
}
