import * as Rx from 'rxjs/Rx';

import {KeyPressDetector} from '../domain/key-press-detector';
import {KeyCode, KeyDownEvent, KeyRepeatEvent, KeyUpEvent, ModifierCode} from '../domain/keyboard';
import {getLogger} from '../logging';

const logger = getLogger();

export class WindowKeyPressDetector implements KeyPressDetector {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;
  readonly keyRepeat: Rx.Observable<KeyRepeatEvent>;

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

    this.keyRepeat = Rx.Observable.empty();

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
