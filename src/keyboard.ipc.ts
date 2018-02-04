import {KeyCode, Modifiers} from './domain/keyboard';
import {TypedMessageChannel} from './ipc-messaging';

export interface KeyMessage {
  key: KeyCode;
  modifiers: Modifiers;
}

export class KeyUpChannel extends TypedMessageChannel<KeyMessage> {
  constructor() {
    super('kb-keyup');
  }
}

export class KeyDownChannel extends TypedMessageChannel<KeyMessage> {
  constructor() {
    super('kb-keydown');
  }
}

export class KeyRepeatChannel extends TypedMessageChannel<KeyMessage> {
  constructor() {
    super('kb-keyrepeat');
  }
}
