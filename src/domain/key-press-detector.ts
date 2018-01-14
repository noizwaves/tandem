import * as Rx from 'rxjs/Rx';

import {KeyDownEvent, KeyUpEvent} from './keyboard';

export interface KeyPressDetector {
  readonly keyUp: Rx.Observable<KeyUpEvent>;
  readonly keyDown: Rx.Observable<KeyDownEvent>;

  dispose(): void;
}
