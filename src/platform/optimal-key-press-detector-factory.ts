import {KeyPressDetectorFactory} from '../domain/key-press-detector-factory';
import {KeyPressDetector} from '../domain/key-press-detector';
import {KeyboardKeyPressDetector} from './keyboard-key-press-detector';
import {WindowKeyPressDetector} from './window-key-press-detector';

export class OptimalKeyPressDetectorFactory implements KeyPressDetectorFactory {
  constructor(private externalKeyboard: boolean, private ipc, private window) {
  }

  getKeyPressDetector(): KeyPressDetector {
    return this.externalKeyboard
      ? new KeyboardKeyPressDetector(this.ipc)
      : new WindowKeyPressDetector(this.window);
  }
}
