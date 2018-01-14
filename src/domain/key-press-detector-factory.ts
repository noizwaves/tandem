import {KeyPressDetector} from './key-press-detector';

export interface KeyPressDetectorFactory {
  getKeyPressDetector(): KeyPressDetector;
}
