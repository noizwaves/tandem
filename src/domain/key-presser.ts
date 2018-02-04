import {KeyCode, Modifiers} from './keyboard';

export interface KeyPresser {
  pressUp(code: KeyCode, modifiers: Modifiers): void;
  pressDown(code: KeyCode, modifiers: Modifiers): void;
  press(code: KeyCode, modifiers: Modifiers): void;
}
