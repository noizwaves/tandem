import {Keyboard} from '../domain/keyboard';

export class KeyboardFactory {
  getKeyboard(): Keyboard {
    // if (process.platform === 'darwin') {
      // const { MacOsKeyboard } = require('./macos');
      // return new MacOsKeyboard();
    // }

    return null;
  }
}
