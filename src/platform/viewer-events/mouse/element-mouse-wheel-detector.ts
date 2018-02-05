import * as Rx from 'rxjs';

import {MouseWheelChange, MouseWheelDetector} from '../../../domain/mouse-wheel-detector';


export class ElementMouseWheelDetector implements MouseWheelDetector {
  readonly wheelChange: Rx.Observable<MouseWheelChange>;

  private readonly _wheelChange: Rx.Subject<MouseWheelChange>;
  private readonly wheelHandler: (event: MouseWheelEvent) => void;

  constructor(private remoteScreen: HTMLMediaElement) {
    this._wheelChange = new Rx.Subject<MouseWheelChange>();
    this.wheelChange = this._wheelChange;

    const rawWheelEvents = new Rx.Subject<MouseWheelChange>();

    this.wheelHandler = (event: MouseWheelEvent) => {
      event.stopPropagation();
      event.preventDefault();

      const delta: MouseWheelChange = {deltaX: event.deltaX, deltaY: event.deltaY};
      rawWheelEvents.next(delta);
    };

    remoteScreen.addEventListener('wheel', this.wheelHandler);

    rawWheelEvents
      .bufferTime(33)
      .subscribe((deltas: MouseWheelChange[]) => {
        if (deltas.length === 0) {
          return;
        }

        const groupedDelta = {
          deltaX: deltas.map(d => d.deltaX).reduce(sum, 0),
          deltaY: deltas.map(d => d.deltaY).reduce(sum, 0),
        };

        this._wheelChange.next(groupedDelta);
      });
  }

  dispose(): void {
    this.remoteScreen.removeEventListener('wheel', this.wheelHandler);
  }
}


const sum = (x, y) => x + y;
