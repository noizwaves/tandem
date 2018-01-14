import {KeyPressDetector} from './key-press-detector';
import {MousePositionDetector} from './mouse-position-detector';
import {MouseButtonDetector} from './mouse';
import {MouseWheelDetector} from './mouse-wheel-detector';

export interface DetectorFactory {
  getKeyPressDetector(): KeyPressDetector;
  getMousePositionDetector(): MousePositionDetector;
  getMouseButtonDetector(): MouseButtonDetector;
  getMouseWheelDetector(): MouseWheelDetector;
}
