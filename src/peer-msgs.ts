import {KeyCode, Modifiers} from './keyboard';


export const MOUSEMOVE = 'mousemove';

export function sendMouseMove(peer, x: number, y: number) {

  const data = {t: MOUSEMOVE, x, y};
  peer.send(JSON.stringify(data));
}

export function unpackMouseMove(message): { x: number, y: number } {

  const x = <number> message.x;
  const y = <number> message.y;
  return {x, y};

}


export const MOUSEDOWN = 'mousedown';

export enum MouseButton {
  LEFT = 'left',
  MIDDLE = 'middle',
  RIGHT = 'right',
}

export function sendMouseDown(peer, x: number, y: number, button: MouseButton) {
  const data = {t: MOUSEDOWN, x, y, b: button};
  peer.send(JSON.stringify(data));
}

export function unpackMouseDown(message): { x: number, y: number, button: MouseButton } {
  const x = <number> message.x;
  const y = <number> message.y;
  const button = <MouseButton> message.b;
  return {x, y, button};
}


export const MOUSEUP = 'mouseup';

export function sendMouseUp(peer, x: number, y: number, button: MouseButton) {
  const data = {t: MOUSEUP, x, y, b: button};
  peer.send(JSON.stringify(data));
}

export function unpackMouseUp(message): { x: number, y: number, button: MouseButton } {
  const x = <number> message.x;
  const y = <number> message.y;
  const button = <MouseButton> message.b;
  return {x, y, button};
}


export const SCROLL = 'scroll';

export function sendScroll(peer, deltaX: number, deltaY: number) {
  const data = {t: SCROLL, x: deltaX, y: deltaY};
  peer.send(JSON.stringify(data));
}

export function unpackScroll(message): { x: number, y: number } {
  const x = <number> message.x;
  const y = <number> message.y;
  return {x, y};
}


export const KEYUP = 'keyup';

export function sendKeyUp(peer, code: KeyCode, modifiers: Modifiers) {
  const message = {
    t: KEYUP,
    code: code.toString(),
    modifiers: modifiers.map(m => m.toString())
  };
  const data = JSON.stringify(message);
  peer.send(data);
}

export function unpackKeyUp(message): { code: KeyCode, modifiers: Modifiers } {
  const code = <KeyCode> message.code;
  const modifiers = <Modifiers> message.modifiers;

  return {code, modifiers};
}


export const KEYDOWN = 'keydown';

export function sendKeyDown(peer, code: KeyCode, modifiers: Modifiers) {
  const message = {
    t: KEYDOWN,
    code: code.toString(),
    modifiers: modifiers.map(m => m.toString())
  };
  const data = JSON.stringify(message);
  peer.send(data);
}

export function unpackKeyDown(message): { code: KeyCode, modifiers: Modifiers } {
  const code = <KeyCode> message.code;
  const modifiers = <Modifiers> message.modifiers;

  return {code, modifiers};
}


export const SCREEN_SIZE = 'screensize';

export function sendScreenSize(peer, height: number, width: number) {
  const message = {
    t: SCREEN_SIZE,
    h: height,
    w: width
  };
  const data = JSON.stringify(message);
  peer.send(data);
}

export function unpackScreenSize(message): { height: number, width: number } {
  const height = <number> message.h;
  const width = <number> message.w;

  return {height, width};
}
