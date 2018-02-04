import * as Rx from 'rxjs/Rx';

import {KeyDownEvent, KeyRepeatEvent, KeyUpEvent} from './keyboard';

export interface KeyPressDetector {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;
  readonly keyRepeat: Rx.Observable<KeyRepeatEvent>;

  dispose(): void;
}
