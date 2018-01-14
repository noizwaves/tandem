import * as Rx from 'rxjs/Rx';

export interface MouseWheelChange {
  deltaX: number;
  deltaY: number;
}

export interface MouseWheelDetector {
  readonly wheelChange: Rx.Observable<MouseWheelChange>;

  dispose(): void;
}
