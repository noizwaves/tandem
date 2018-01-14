import {KeyPressDetector} from './key-press-detector';
import {MousePositionDetector} from './mouse-position-detector';
import {MouseButtonDetector} from './mouse';

export interface DetectorFactory {
  getKeyPressDetector(): KeyPressDetector;
  getMousePositionDetector(): MousePositionDetector;
  getMouseButtonDetector(): MouseButtonDetector;
}
