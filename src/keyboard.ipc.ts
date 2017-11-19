import {BrowserWindow, IpcRenderer} from 'electron';
import {KeyCode, KeyDownEvent, KeyUpEvent, Modifiers} from './keyboard';


const KEYUP = 'kb-keyup';

export function sendKeyUp(target: BrowserWindow, event: KeyUpEvent) {
  target.webContents.send(KEYUP, event.key, event.modifiers);
}

interface KeyUpCallback {
  (code: KeyCode, modifiers: Modifiers): void;
}

export function onKeyUp(ipc: IpcRenderer, callback: KeyUpCallback) {
  ipc.on(KEYUP, function (event, code, modifiers) {
    callback(code, modifiers);
  });
}


const KEYDOWN = 'kb-keydown';

export function sendKeyDown(target: BrowserWindow, event: KeyDownEvent) {
  target.webContents.send(KEYDOWN, event.key, event.modifiers);
}

interface KeyDownCallback {
  (code: KeyCode, modifiers: Modifiers): void;
}

export function onKeyDown(ipc: IpcRenderer, callback: KeyDownCallback) {
  ipc.on(KEYDOWN, function (event, code, modifiers) {
    callback(code, modifiers);
  });
}
