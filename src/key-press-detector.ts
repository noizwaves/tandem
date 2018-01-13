import * as Rx from 'rxjs';
import {IpcRenderer} from 'electron';

import {KeyCode, KeyDownEvent, KeyUpEvent, ModifierCode} from './keyboard';
import {KeyDownChannel, KeyUpChannel} from './keyboard.ipc';
import {getLogger} from './logging';

const logger = getLogger();

export interface KeyPressDetector {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;
  dispose(): void;
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

export class WindowKeyPressDetector implements KeyPressDetector {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;

  private readonly _keyUp: Rx.Subject<KeyUpEvent>;
  private readonly _keyDown: Rx.Subject<KeyDownEvent>;
  private readonly _heldModifiers: Set<ModifierCode>;

  private readonly downHandler: (e: any) => void;
  private readonly upHandler: (e: any) => void;

  constructor(private window: Window) {
    this._keyUp = new Rx.Subject<KeyUpEvent>();
    this._keyDown = new Rx.Subject<KeyDownEvent>();
    this.keyUp = this._keyUp;
    this.keyDown = this._keyDown;

    this._heldModifiers = new Set<ModifierCode>();

    this.downHandler = (e: any) => {
      const rawCode = <string> e.code;
      if (!(rawCode in KeyCode)) {
        logger.warnSensitive('[WindowKeyPressDetector] Ignoring unhandled window.keydown event', rawCode);
        return;
      }

      if (isMeta(rawCode)) {
        this._heldModifiers.add(<ModifierCode> rawCode);
      }

      const modifiers = Array.from(this._heldModifiers.values());
      this._keyDown.next({key: <KeyCode> rawCode, modifiers});
      logger.debugSensitive('[WindowKeyPressDetector] Key down', rawCode);
      logger.debugSensitive('[WindowKeyPressDetector] ... with modifiers', modifiers);
    };
    window.addEventListener('keydown', this.downHandler, true);

    this.upHandler = (e: any) => {
      const rawCode = <string> e.code;
      if (!(rawCode in KeyCode)) {
        logger.warnSensitive('[WindowKeyPressDetector] Ignoring unhandled window.keyup event', rawCode);
        return;
      }

      if (isMeta(rawCode)) {
        this._heldModifiers.delete(<ModifierCode> rawCode);
      }

      const modifiers = Array.from(this._heldModifiers.values());
      this._keyUp.next({key: <KeyCode> rawCode, modifiers});
      logger.debug(`[WindowKeyPressDetector] Key up with modifiers`);
      logger.debugSensitive('[WindowKeyPressDetector] Key up', rawCode);
      logger.debugSensitive('[WindowKeyPressDetector] ... with modifiers', modifiers);
    };
    window.addEventListener('keyup', this.upHandler, true);
  }

  dispose(): void {
    this.window.removeEventListener('keydown', this.downHandler, true);
    this.window.removeEventListener('keyup', this.upHandler, true);
  }
}

export class ExternalKeyPressDetector implements KeyPressDetector {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;

  private readonly _keyUp: Rx.Subject<KeyUpEvent>;
  private readonly _keyDown: Rx.Subject<KeyDownEvent>;
  private readonly keyUpChannel: KeyUpChannel;
  private readonly keyDownChannel: KeyDownChannel;

  constructor(ipc: IpcRenderer) {
    this._keyUp = new Rx.Subject<KeyUpEvent>();
    this._keyDown = new Rx.Subject<KeyDownEvent>();
    this.keyUp = this._keyUp;
    this.keyDown = this._keyDown;

    this.keyUpChannel = new KeyUpChannel();
    this.keyUpChannel.on(ipc, e => this._keyUp.next(e));

    this.keyDownChannel = new KeyDownChannel();
    this.keyDownChannel.on(ipc, e => this._keyDown.next(e));
  }

  dispose(): void {
    this.keyUpChannel.dispose();
    this.keyDownChannel.dispose();
  }
}