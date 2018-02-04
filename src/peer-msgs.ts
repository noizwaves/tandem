import {KeyCode, Modifiers} from './domain/keyboard';
import {MouseButton} from './domain/mouse';


export interface PeerMessageChannel<T> {
  // GOAL: this is an implementation detail and not public
  readonly type: string;

  send(peer, message: T);

  // GOAL: on(peer, (message: T) => void)
  unpack(message: object): T;
}


export interface MouseMoveMessage {
  x: number;
  y: number;
}

class MouseMoveChannel implements PeerMessageChannel<MouseMoveMessage> {
  readonly type = 'mousemove';

  send(peer, message: MouseMoveMessage) {
    const data = {t: this.type, x: message.x, y: message.y};
    peer.send(JSON.stringify(data));
  }

  unpack(message: object): MouseMoveMessage {
    const x = <number> (<any> message).x;
    const y = <number> (<any> message).y;
    return {x, y};
  }
}

export const MouseMove: PeerMessageChannel<MouseMoveMessage> = new MouseMoveChannel();


export interface MouseButtonMessage {
  x: number;
  y: number;
  button: MouseButton;
}

export enum DeprecatedMouseButton {
  LEFT = 'left',
  MIDDLE = 'middle',
  RIGHT = 'right',
}


class MouseDownChannel implements PeerMessageChannel<MouseButtonMessage> {
  readonly type = 'mousedown';

  send(peer, message: MouseButtonMessage) {
    const data = {t: this.type, x: message.x, y: message.y, b: message.button};
    peer.send(JSON.stringify(data));
  }

  unpack(message: object): MouseButtonMessage {
    const x = <number> (<any>message).x;
    const y = <number> (<any>message).y;
    const button = <MouseButton> (<any>message).b;
    return {x, y, button};
  }
}

export const MouseDown: PeerMessageChannel<MouseButtonMessage> = new MouseDownChannel();


class MouseUpChannel implements PeerMessageChannel<MouseButtonMessage> {
  readonly type = 'mouseup';

  send(peer, message: MouseButtonMessage) {
    const data = {t: this.type, x: message.x, y: message.y, b: message.button};
    peer.send(JSON.stringify(data));
  }

  unpack(message: object): MouseButtonMessage {
    const x = <number> (<any>message).x;
    const y = <number> (<any>message).y;
    const button = <MouseButton> (<any>message).b;
    return {x, y, button};
  }
}

export const MouseUp: PeerMessageChannel<MouseButtonMessage> = new MouseUpChannel();


class DoubleClickChannel implements PeerMessageChannel<MouseButtonMessage> {
  readonly type = 'dblclk';

  send(peer, message: MouseButtonMessage) {
    const data = {t: this.type, x: message.x, y: message.y, b: message.button};
    peer.send(JSON.stringify(data));
  }

  unpack(message: object): MouseButtonMessage {
    const x = <number> (<any>message).x;
    const y = <number> (<any>message).y;
    const button = <MouseButton> (<any>message).b;
    return {x, y, button};
  }
}

export const DoubleClick: PeerMessageChannel<MouseButtonMessage> = new DoubleClickChannel();


export interface ScrollMessage {
  deltaX: number;
  deltaY: number;
}

class ScrollChannel implements PeerMessageChannel<ScrollMessage> {
  readonly type = 'scroll';

  send(peer, message: ScrollMessage) {
    const data = {t: this.type, x: message.deltaX, y: message.deltaY};
    peer.send(JSON.stringify(data));
  }

  unpack(message: object): ScrollMessage {
    const deltaX = <number> (<any>message).x;
    const deltaY = <number> (<any>message).y;
    return {deltaX, deltaY};
  }

}

export const Scroll: PeerMessageChannel<ScrollMessage> = new ScrollChannel();


export interface KeyMessage {
  code: KeyCode;
  modifiers: Modifiers;
}


class KeyUpChannel implements PeerMessageChannel<KeyMessage> {
  readonly type = 'keyup';

  send(peer, message: KeyMessage) {
    const data = JSON.stringify({
      t: this.type,
      code: message.code.toString(),
      modifiers: message.modifiers.map(m => m.toString())
    });
    peer.send(data);
  }

  unpack(message: object): KeyMessage {
    const code = <KeyCode> (<any>message).code;
    const modifiers = <Modifiers> (<any>message).modifiers;

    return {code, modifiers};
  }

}

export const KeyUp: PeerMessageChannel<KeyMessage> = new KeyUpChannel();


class KeyDownChannel implements PeerMessageChannel<KeyMessage> {
  readonly type = 'keydown';

  send(peer, message: KeyMessage) {
    const data = JSON.stringify({
      t: this.type,
      code: message.code.toString(),
      modifiers: message.modifiers.map(m => m.toString())
    });
    peer.send(data);
  }

  unpack(message: object): KeyMessage {
    const code = <KeyCode> (<any>message).code;
    const modifiers = <Modifiers> (<any>message).modifiers;

    return {code, modifiers};
  }
}

export const KeyDown: PeerMessageChannel<KeyMessage> = new KeyDownChannel();


class KeyRepeatChannel implements PeerMessageChannel<KeyMessage> {
  readonly type = 'keyrepeat';

  send(peer, message: KeyMessage) {
    const data = JSON.stringify({
      t: this.type,
      code: message.code.toString(),
      modifiers: message.modifiers.map(m => m.toString())
    });
    peer.send(data);
  }

  unpack(message: object): KeyMessage {
    const code = <KeyCode> (<any>message).code;
    const modifiers = <Modifiers> (<any>message).modifiers;

    return {code, modifiers};
  }
}

export const KeyRepeat: PeerMessageChannel<KeyMessage> = new KeyRepeatChannel();


export interface ScreenSizeMessage {
  height: number;
  width: number;
}


class ScreenSizeChannel implements PeerMessageChannel<ScreenSizeMessage> {
  readonly type = 'screensize';

  send(peer, message: ScreenSizeMessage) {
    const data = JSON.stringify({
      t: this.type,
      h: message.height,
      w: message.width,
    });
    peer.send(data);
  }

  unpack(message: object): ScreenSizeMessage {
    const height = <number> (<any>message).h;
    const width = <number> (<any>message).w;

    return {height, width};
  }

}

export const ScreenSize: PeerMessageChannel<ScreenSizeMessage> = new ScreenSizeChannel();
