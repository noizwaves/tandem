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
  private readonly mouseMoveHandler: (event: MouseEvent) => void;

  constructor(private remoteScreen: HTMLMediaElement) {
    this._position = new Rx.Subject<MousePosition>();
    this.position = this._position;

    const movements = new Rx.Subject<MousePosition>();

    this.mouseMoveHandler = (event: MouseEvent) => {
      event.stopPropagation();
      event.preventDefault();

      movements.next({
        x: event.offsetX,
        y: event.offsetY,
        width: remoteScreen.clientWidth,
        height: remoteScreen.clientHeight
      });
    };
    remoteScreen.addEventListener('mousemove', this.mouseMoveHandler);

    movements
      .bufferTime(33)
      .subscribe((positions: MousePosition[]) => {
        if (positions.length === 0) {
          return;
        }

        this._position.next(positions[positions.length - 1]);
      });
  }

  dispose(): void {
    this.remoteScreen.removeEventListener('mousemove', this.mouseMoveHandler);
  }
}
