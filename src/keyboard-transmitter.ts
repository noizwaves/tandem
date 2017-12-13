import * as Rx from 'rxjs';
import {IpcRenderer} from 'electron';

import {KeyCode, KeyDownEvent, KeyUpEvent, ModifierCode} from './keyboard';
import {onKeyDown, onKeyUp} from './keyboard.ipc';
import {getLogger} from './logging';

const logger = getLogger();

export interface KeyboardTransmitter {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;
}

function isMeta(rawCode: string): boolean {
  switch (rawCode) {
    case 'ShiftLeft':
    case 'ShiftRight':
      return true;
    case 'ControlLeft':
    case 'ControlRight':
      return true;
    case 'AltLeft':
    case 'AltRight':
      return true;
    case 'MetaLeft':
    case 'MetaRight':
      return true;
    default:
      return false;
  }
}

export class WindowTransmitter implements KeyboardTransmitter {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;

  private readonly _keyUp: Rx.Subject<KeyUpEvent>;
  private readonly _keyDown: Rx.Subject<KeyDownEvent>;
  private readonly _heldModifiers: Set<ModifierCode>;

  constructor(window: Window) {
    this._keyUp = new Rx.Subject<KeyUpEvent>();
    this._keyDown = new Rx.Subject<KeyDownEvent>();
    this.keyUp = this._keyUp;
    this.keyDown = this._keyDown;

    this._heldModifiers = new Set<ModifierCode>();

    window.addEventListener('keydown', (e: any) => {
      const rawCode = <string> e.code;
      if (!(rawCode in KeyCode)) {
        logger.warn(`Unhandled window.keydown event with code ${rawCode}, ignoring`);
        return;
      }

      if (isMeta(rawCode)) {
        this._heldModifiers.add(<ModifierCode> rawCode);
      }

      const modifiers = Array.from(this._heldModifiers.values());
      this._keyDown.next({key: <KeyCode> rawCode, modifiers});
      logger.debug(`[WindowTransmitter] Key down of ${rawCode} with modifiers ${modifiers}`);
    }, true);

    window.addEventListener('keyup', (e: any) => {
      const rawCode = <string> e.code;
      if (!(rawCode in KeyCode)) {
        logger.warn(`Unhandled window.keyup event with code ${rawCode}, ignoring`);
        return;
      }

      if (isMeta(rawCode)) {
        this._heldModifiers.delete(<ModifierCode> rawCode);
      }

      const modifiers = Array.from(this._heldModifiers.values());
      this._keyUp.next({key: <KeyCode> rawCode, modifiers});
      logger.debug(`[WindowTransmitter] Key up of ${rawCode} with modifiers ${modifiers}`);
    }, true);
  }
}

export class ExternalTransmitter implements KeyboardTransmitter {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;

  private readonly _keyUp: Rx.Subject<KeyUpEvent>;
  private readonly _keyDown: Rx.Subject<KeyDownEvent>;

  constructor(ipc: IpcRenderer) {
    this._keyUp = new Rx.Subject<KeyUpEvent>();
    this._keyDown = new Rx.Subject<KeyDownEvent>();
    this.keyUp = this._keyUp;
    this.keyDown = this._keyDown;

    onKeyUp(ipc, (key, modifiers) => this._keyUp.next({key, modifiers}));
    onKeyDown(ipc, (key, modifiers) => this._keyDown.next({key, modifiers}));
  }
}
