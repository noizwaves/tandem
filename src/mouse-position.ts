import * as Rx from 'rxjs';


export interface MousePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MousePositionDetector {
  readonly position: Rx.Observable<MousePosition>;

  private readonly _position: Rx.Subject<MousePosition>;

  constructor(remoteScreen: HTMLMediaElement) {
    this._position = new Rx.Subject<MousePosition>();
    this.position = this._position;

    const movements = new Rx.Subject<MousePosition>();

    remoteScreen.addEventListener('mousemove', function (event: MouseEvent) {
      event.stopPropagation();
      event.preventDefault();

      movements.next({
        x: event.offsetX,
        y: event.offsetY,
        width: remoteScreen.clientWidth,
        height: remoteScreen.clientHeight
      });
    });

    movements
      .bufferTime(33)
      .subscribe((positions: MousePosition[]) => {
        if (positions.length === 0) {
          return;
        }

        this._position.next(positions[positions.length-1]);
      });
  }
}