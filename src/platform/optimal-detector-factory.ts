import {DetectorFactory} from '../domain/detector-factory';
import {KeyPressDetector} from '../domain/key-press-detector';
import {KeyboardKeyPressDetector} from './keyboard-key-press-detector';
import {WindowKeyPressDetector} from './window-key-press-detector';
import {MousePositionDetector} from '../domain/mouse-position-detector';
import {ElementMousePositionDetector} from './element-mouse-position-detector';
import {MouseButtonDetector} from '../domain/mouse';
import {ElementMouseButtonDetector} from './element-mouse-button-detector';

export class OptimalDetectorFactory implements DetectorFactory {
  constructor(private externalKeyboard: boolean,
              private ipc,
              private window,
              private remoteScreen: HTMLMediaElement) {
  }

  getKeyPressDetector(): KeyPressDetector {
    return this.externalKeyboard
      ? new KeyboardKeyPressDetector(this.ipc)
      : new WindowKeyPressDetector(this.window);
  }

  getMousePositionDetector(): MousePositionDetector {
    return new ElementMousePositionDetector(this.remoteScreen);
  }

  getMouseButtonDetector(): MouseButtonDetector {
    return new ElementMouseButtonDetector(this.remoteScreen);
  }
}
