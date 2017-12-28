import * as Rx from 'rxjs';

import {getLogger} from './logging';

const logger = getLogger();


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

export class MouseButtonDetector {
  readonly up: Rx.Observable<MouseButtonEvent>;
  readonly down: Rx.Observable<MouseButtonEvent>;

  private readonly _up: Rx.Subject<MouseButtonEvent>;
  private readonly _down: Rx.Subject<MouseButtonEvent>;
  private readonly downHandler: (event: MouseEvent) => void;
  private readonly upHandler: (event: MouseEvent) => void;

  constructor(private remoteScreen: HTMLMediaElement) {
    this._up = new Rx.Subject<MouseButtonEvent>();
    this._down = new Rx.Subject<MouseButtonEvent>();

    this.up = this._up;
    this.down = this._down;

    const anyDirectionHandler = (event: MouseEvent, direction: MouseButtonDirection) => {
      event.stopPropagation();
      event.preventDefault();

      logger.debug(`[MouseButtonDetector] button event detected for ${event.button} going ${direction}`);

      let targetSub: Rx.Subject<MouseButtonEvent> = null;
      switch (direction) {
        case MouseButtonDirection.DOWN:
          targetSub = this._down;
          break;
        case MouseButtonDirection.UP:
          targetSub = this._up;
          break;
        default:
          logger.error(`[MouseButtonDetector] Unhandled direction of ${direction} when picking target subject`);
          return;
      }

      let button: MouseButton = null;
      switch (event.button) {
        case 0:
          button = MouseButton.LEFT;
          break;
        case 1:
          button = MouseButton.MIDDLE;
          break;
        case 2:
          button = MouseButton.RIGHT;
          break;
        default:
          logger.error(`[MouseButtonDetector] Unhandled button of ${event.button} when mapping to MouseButton`);
          return;
      }

      targetSub.next({
        x: event.offsetX,
        y: event.offsetY,
        width: remoteScreen.clientWidth,
        height: remoteScreen.clientHeight,
        direction,
        button,
      });
    };

    this.downHandler = (event) => anyDirectionHandler(event, MouseButtonDirection.DOWN);
    remoteScreen.addEventListener('mousedown', this.downHandler);

    this.upHandler = (event: MouseEvent) => anyDirectionHandler(event, MouseButtonDirection.UP);
    remoteScreen.addEventListener('mouseup', this.upHandler);
  }

  dispose(): void {
    this.remoteScreen.removeEventListener('mousedown', this.downHandler);
    this.remoteScreen.removeEventListener('mouseup', this.upHandler);
  }
}
