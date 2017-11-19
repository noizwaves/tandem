import {KeyCode, KeyPresser, ModifierCode, Modifiers} from '../keyboard';
import * as robot from 'robotjs';

function toRobotKey(code: KeyCode): string {
  const codeStr = code.toString();
  if (codeStr.startsWith('Key')) {
    return codeStr.substr(3).toLowerCase();
  } else if (codeStr.startsWith('Digit')) {
    return codeStr.substr(5);
  } else if (codeStr.startsWith('F') && (codeStr.length === 2 || codeStr.length === 3)) {
    return codeStr.toLowerCase();
  }

  switch (code) {
    case KeyCode.ShiftLeft:
    case KeyCode.ShiftRight:
      return 'shift';
    case KeyCode.ControlLeft:
    case KeyCode.ControlRight:
      return 'control';
    case KeyCode.AltLeft:
    case KeyCode.AltRight:
      return 'alt';
    case KeyCode.MetaLeft:
    case KeyCode.MetaRight:
      return 'command';
    case KeyCode.Space:
      return 'space';
    case KeyCode.Escape:
      return 'escape';
    case KeyCode.Enter:
      return 'enter';
    case KeyCode.Tab:
      return 'tab';
    case KeyCode.Backspace:
      return 'backspace';
    case KeyCode.Delete:
      return 'delete';
    case KeyCode.ArrowRight:
      return 'right';
    case KeyCode.ArrowUp:
      return 'up';
    case KeyCode.ArrowLeft:
      return 'left';
    case KeyCode.ArrowDown:
      return 'down';

    case KeyCode.Home:
      return 'home';
    case KeyCode.End:
      return 'end';
    case KeyCode.PageUp:
      return 'pageup';
    case KeyCode.PageDown:
      return 'pagedown';

    case KeyCode.Numpad0:
      return 'numpad_0';
    case KeyCode.Numpad1:
      return 'numpad_1';
    case KeyCode.Numpad2:
      return 'numpad_2';
    case KeyCode.Numpad3:
      return 'numpad_3';
    case KeyCode.Numpad4:
      return 'numpad_4';
    case KeyCode.Numpad5:
      return 'numpad_5';
    case KeyCode.Numpad6:
      return 'numpad_6';
    case KeyCode.Numpad7:
      return 'numpad_7';
    case KeyCode.Numpad8:
      return 'numpad_8';
    case KeyCode.Numpad9:
      return 'numpad_9';

    case KeyCode.Period:
      return '.';
    case KeyCode.Quote:
      return '\'';
    case KeyCode.BracketRight:
      return ']';
    case KeyCode.BracketLeft:
      return '[';
    case KeyCode.Semicolon:
      return ';';
    case KeyCode.Slash:
      return '/';
    case KeyCode.Backslash:
      return '\\';
    case KeyCode.Comma:
      return ',';
    case KeyCode.Equal:
      return '=';
    case KeyCode.Minus:
      return '-';
    case KeyCode.Backquote:
      return '`';

    default:
      return null;
  }
}

function toRobotKeyModifier(code: ModifierCode): string {
  switch (code) {
    case ModifierCode.ShiftLeft:
    case ModifierCode.ShiftRight:
      return 'shift';
    case ModifierCode.ControlLeft:
    case ModifierCode.ControlRight:
      return 'control';
    case ModifierCode.AltLeft:
    case ModifierCode.AltRight:
      return 'alt';
    case ModifierCode.MetaLeft:
    case ModifierCode.MetaRight:
      return 'command';
    default:
      return null;
  }
}

export class RobotKeyPresser implements KeyPresser {
  press(code: KeyCode, modifiers: Modifiers): void {
    const robotKey = toRobotKey(code);
    if (!robotKey) {
      console.log(`RobotJS lacks support for ${code}`);
      return;
    }

    const robotModifiers = modifiers.map(toRobotKeyModifier);
    robot.keyTap(robotKey, robotModifiers);
  }
}
