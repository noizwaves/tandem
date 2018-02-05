import {DetectorFactory} from '../../domain/detector-factory';
import {KeyPressDetector} from '../../domain/key-press-detector';
import {MousePositionDetector} from '../../domain/mouse-position-detector';
import {MouseButtonDetector} from '../../domain/mouse';
import {MouseWheelDetector} from '../../domain/mouse-wheel-detector';

import {ExternalKeyboardKeyPressDetector} from './keyboard/external-keyboard-key-press-detector';
import {WindowKeyPressDetector} from './keyboard/window-key-press-detector';
import {ElementMousePositionDetector} from './mouse/element-mouse-position-detector';
import {ElementMouseButtonDetector} from './mouse/element-mouse-button-detector';
import {ElementMouseWheelDetector} from './mouse/element-mouse-wheel-detector';
import {RemoteWindowFocus} from './remote-window-focus';
import {IpcRemoteWindowFocus} from './ipc-remote-window-focus';

export class OptimalDetectorFactory implements DetectorFactory {
  constructor(private externalKeyboard: boolean,
              private ipc,
              private window,
              private remoteScreen: HTMLMediaElement) {
  }

  getKeyPressDetector(): KeyPressDetector {
    return this.externalKeyboard
      ? new ExternalKeyboardKeyPressDetector(this.ipc)
      : new WindowKeyPressDetector(this.window);
  }

  getMousePositionDetector(): MousePositionDetector {
    const windowFocus: RemoteWindowFocus = new IpcRemoteWindowFocus(this.ipc);
    return new ElementMousePositionDetector(this.remoteScreen, windowFocus);
  }

  getMouseButtonDetector(): MouseButtonDetector {
    return new ElementMouseButtonDetector(this.remoteScreen);
  }

  getMouseWheelDetector(): MouseWheelDetector {
    return new ElementMouseWheelDetector(this.remoteScreen);
  }
}
