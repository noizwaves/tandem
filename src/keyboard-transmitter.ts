import * as Rx from 'rxjs';
import {IpcRenderer} from 'electron';

import {KeyCode, KeyUpEvent, ModifierCode} from '../keyboard';
import {onKeyUp} from '../keyboard.ipc';

export interface KeyboardTransmitter {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
}

function isMeta(rawCode: string): boolean {
  switch (rawCode) {
    case 'ShiftRight':
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

  private readonly _keyUp: Rx.Subject<KeyUpEvent>;
  private readonly _heldModifiers: Set<ModifierCode>;

  constructor(window: Window) {
    this._keyUp = new Rx.Subject<KeyUpEvent>();
    this.keyUp = this._keyUp;

    this._heldModifiers = new Set<ModifierCode>();

    window.addEventListener('keydown', (e: any) => {
      const rawCode = <string> e.code;
      if (!(rawCode in KeyCode)) {
        console.log(`Unhandled window.keydown event with code ${rawCode}, ignoring`);
        return;
      }

      if (isMeta(rawCode)) {
        this._heldModifiers.add(<ModifierCode> rawCode);
      }
    }, true);

    window.addEventListener('keyup', (e: any) => {
      const rawCode = <string> e.code;
      if (!(rawCode in KeyCode)) {
        console.log(`Unhandled window.keyup event with code ${rawCode}, ignoring`);
        return;
      }

      if (isMeta(rawCode)) {
        this._heldModifiers.delete(<ModifierCode> rawCode);
      } else {
        const modifiers = Array.from(this._heldModifiers.values());

        this._keyUp.next({key: <KeyCode> rawCode, modifiers});
      }
    }, true);
  }
}

export class ExternalTransmitter implements KeyboardTransmitter {
  readonly keyUp: Rx.Observable<KeyUpEvent>;

  private readonly _keyUp: Rx.Subject<KeyUpEvent>;

  constructor(ipc: IpcRenderer) {
    this._keyUp = new Rx.Subject<KeyUpEvent>();
    this.keyUp = this._keyUp;

    onKeyUp(ipc, (key, modifiers) => this._keyUp.next({key, modifiers}));
  }
}
