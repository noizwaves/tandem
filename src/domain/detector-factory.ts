import {KeyPressDetector} from './key-press-detector';
import {MousePositionDetector} from './mouse-position-detector';

export interface DetectorFactory {
  getKeyPressDetector(): KeyPressDetector;
  getMousePositionDetector(): MousePositionDetector;
}
