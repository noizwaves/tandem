import * as Rx from 'rxjs';
import {IpcRenderer} from 'electron';

import {KeyDownEvent, KeyUpEvent} from '../domain/keyboard';
import {KeyDownChannel, KeyUpChannel} from '../keyboard.ipc';
import {KeyPressDetector} from '../domain/key-press-detector';

export class KeyboardKeyPressDetector implements KeyPressDetector {
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
