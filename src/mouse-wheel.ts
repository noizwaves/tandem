import * as Rx from 'rxjs';


export interface MouseWheelChange {
  deltaX: number;
  deltaY: number;
}

export class MouseWheelDetector {
  readonly wheelChange: Rx.Observable<MouseWheelChange>;

  private readonly _wheelChange: Rx.Subject<MouseWheelChange>;

  constructor(remoteScreen: HTMLMediaElement) {
    this._wheelChange = new Rx.Subject<MouseWheelChange>();
    this.wheelChange = this._wheelChange;

    const rawWheelEvents = new Rx.Subject<MouseWheelChange>();

    remoteScreen.addEventListener('wheel', function (event: MouseWheelEvent) {
      event.stopPropagation();
      event.preventDefault();

      const delta: MouseWheelChange = {deltaX: event.deltaX, deltaY: event.deltaY};
      rawWheelEvents.next(delta);
    });

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
}


const sum = (x, y) => x + y;
