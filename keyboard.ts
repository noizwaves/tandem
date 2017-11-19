import * as Rx from 'rxjs';

export interface KeyDownEvent {
  key: KeyCode;
  modifiers: Modifiers;
}

export interface KeyUpEvent {
  key: KeyCode;
  modifiers: Modifiers;
}

export enum KeyCode {
  KeyA = 'KeyA',
  KeyB = 'KeyB',
  KeyC = 'KeyC',
  KeyD = 'KeyD',
  KeyE = 'KeyE',
  KeyF = 'KeyF',
  KeyG = 'KeyG',
  KeyH = 'KeyH',
  KeyI = 'KeyI',
  KeyJ = 'KeyJ',
  KeyK = 'KeyK',
  KeyL = 'KeyL',
  KeyM = 'KeyM',
  KeyN = 'KeyN',
  KeyO = 'KeyO',
  KeyP = 'KeyP',
  KeyQ = 'KeyQ',
  KeyR = 'KeyR',
  KeyS = 'KeyS',
  KeyT = 'KeyT',
  KeyU = 'KeyU',
  KeyV = 'KeyV',
  KeyW = 'KeyW',
  KeyX = 'KeyX',
  KeyY = 'KeyY',
  KeyZ = 'KeyZ',

  Digit0 = 'Digit0',
  Digit1 = 'Digit1',
  Digit2 = 'Digit2',
  Digit3 = 'Digit3',
  Digit4 = 'Digit4',
  Digit5 = 'Digit5',
  Digit6 = 'Digit6',
  Digit7 = 'Digit7',
  Digit8 = 'Digit8',
  Digit9 = 'Digit9',

  F1 = 'F1',
  F2 = 'F2',
  F3 = 'F3',
  F4 = 'F4',
  F5 = 'F5',
  F6 = 'F6',
  F7 = 'F7',
  F8 = 'F8',
  F9 = 'F9',
  F10 = 'F10',
  F11 = 'F11',
  F12 = 'F12',

  F13 = 'F13',
  F14 = 'F14',
  F15 = 'F15',
  F16 = 'F16',
  F17 = 'F17',
  F18 = 'F18',
  F19 = 'F19',
  F20 = 'F20',

  MetaLeft = 'MetaLeft',
  AltLeft = 'AltLeft',
  ShiftLeft = 'ShiftLeft',
  ControlLeft = 'ControlLeft',

  MetaRight = 'MetaRight',
  AltRight = 'AltRight',
  ShiftRight = 'ShiftRight',
  ControlRight = 'ControlRight',

  ArrowRight = 'ArrowRight',
  ArrowUp = 'ArrowUp',
  ArrowLeft = 'ArrowLeft',
  ArrowDown = 'ArrowDown',

  Function = 'Function',
  Delete = 'Delete',
  Home = 'Home',
  End = 'End',
  PageUp = 'PageUp',
  PageDown = 'PageDown',

  Backquote = 'Backquote',
  CapsLock = 'CapsLock',
  Tab = 'Tab',
  Space = 'Space',
  Backspace = 'Backspace',
  Enter = 'Enter',
  Escape = 'Escape',

  Backslash = 'Backslash',
  Comma = 'Comma',
  Equal = 'Equal',
  BracketLeft = 'BracketLeft',
  Minus = 'Minus',
  Period = 'Period',
  Quote = 'Quote',
  BracketRight = 'BracketRight',
  Semicolon = 'Semicolon',
  Slash = 'Slash',

  Numpad0 = 'Numpad0',
  Numpad1 = 'Numpad1',
  Numpad2 = 'Numpad2',
  Numpad3 = 'Numpad3',
  Numpad4 = 'Numpad4',
  Numpad5 = 'Numpad5',
  Numpad6 = 'Numpad6',
  Numpad7 = 'Numpad7',
  Numpad8 = 'Numpad8',
  Numpad9 = 'Numpad9',

  NumLock = 'NumLock',
  NumpadEqual = 'NumpadEqual',
  NumpadDivide = 'NumpadDivide',
  NumpadMultiply = 'NumpadMultiply',
  NumpadSubtract = 'NumpadSubtract',
  NumpadAdd = 'NumpadAdd',
  NumpadEnter = 'NumpadEnter',
  NumpadDecimal = 'NumpadDecimal',
}

export enum ModifierCode {
  MetaLeft = 'MetaLeft',
  AltLeft = 'AltLeft',
  ShiftLeft = 'ShiftLeft',
  ControlLeft = 'ControlLeft',
  MetaRight = 'MetaRight',
  AltRight = 'AltRight',
  ShiftRight = 'ShiftRight',
  ControlRight = 'ControlRight',
}

export type Modifiers = ModifierCode[];

export interface Keyboard {
  readonly keyDown: Rx.Observable<KeyDownEvent>;
  readonly keyUp: Rx.Observable<KeyUpEvent>;

  plugIn(): void

  unplug(): void
}

export interface KeyPresser {
  pressUp(code: KeyCode, modifiers: Modifiers): void;
  pressDown(code: KeyCode, modifiers: Modifiers): void;
}

