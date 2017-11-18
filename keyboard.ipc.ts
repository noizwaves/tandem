import {BrowserWindow, IpcRenderer} from 'electron';
import {KeyCode, KeyDownEvent, KeyUpEvent, Modifiers, ModifiersEvent} from './keyboard';


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


const MODIFIER = 'kb-modifier';

export function sendModifiers(target: BrowserWindow, event: ModifiersEvent) {
  target.webContents.send(MODIFIER, event.modifiers);
}

interface ModifiersCallback {
  (modifiers: Modifiers): void;
}

export function onModifiers(ipc: IpcRenderer, callback: ModifiersCallback) {
  ipc.on(MODIFIER, function (event, modifiers) {
    callback(modifiers);
  });
}
