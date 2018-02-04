import * as Rx from 'rxjs';
import {IpcRenderer} from 'electron';

import {KeyDownEvent, KeyRepeatEvent, KeyUpEvent} from '../domain/keyboard';
import {KeyDownChannel, KeyRepeatChannel, KeyUpChannel} from '../keyboard.ipc';
import {KeyPressDetector} from '../domain/key-press-detector';

export class KeyboardKeyPressDetector implements KeyPressDetector {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;
  readonly keyRepeat: Rx.Observable<KeyRepeatEvent>;

  private readonly _keyUp: Rx.Subject<KeyUpEvent>;
  private readonly _keyDown: Rx.Subject<KeyDownEvent>;
  private readonly _keyRepeat: Rx.Subject<KeyRepeatEvent>;
  private readonly keyUpChannel: KeyUpChannel;
  private readonly keyDownChannel: KeyDownChannel;
  private readonly keyRepeatChannel: KeyRepeatChannel;

  constructor(ipc: IpcRenderer) {
    this._keyUp = new Rx.Subject<KeyUpEvent>();
    this._keyDown = new Rx.Subject<KeyDownEvent>();
    this._keyRepeat = new Rx.Subject<KeyRepeatEvent>();
    this.keyUp = this._keyUp;
    this.keyDown = this._keyDown;
    this.keyRepeat = this._keyRepeat;

    this.keyUpChannel = new KeyUpChannel();
    this.keyUpChannel.on(ipc, e => this._keyUp.next(e));

    this.keyDownChannel = new KeyDownChannel();
    this.keyDownChannel.on(ipc, e => this._keyDown.next(e));

    this.keyRepeatChannel = new KeyRepeatChannel();
    this.keyRepeatChannel.on(ipc, e => this._keyRepeat.next(e));
  }

  dispose(): void {
    this.keyUpChannel.dispose();
    this.keyDownChannel.dispose();
    this.keyRepeatChannel.dispose();
  }
}
