import {BrowserWindow, IpcMain, IpcRenderer} from 'electron';


const REQUEST_OFFER = 'dc-request-offer';

export function sendRequestOffer(window: BrowserWindow) {
  window.webContents.send(REQUEST_OFFER);
}

export function onRequestOffer(ipc: IpcRenderer, callback: () => void) {
  ipc.on(REQUEST_OFFER, function () {
    callback();
  });
}


const RECEIVE_OFFER = 'dc-receive-offer';

export function sendReceiveOffer(ipc: IpcRenderer, offer: string) {
  ipc.send(RECEIVE_OFFER, offer);
}

export function onReceiveOffer(ipc: IpcMain, callback: (offer: string) => void) {
  ipc.on(RECEIVE_OFFER, function (event, offer) {
    callback(offer);
  })
}


const REQUEST_ANSWER = 'dc-request-answer';

export function sendRequestAnswer(window: BrowserWindow, offer: string) {
  window.webContents.send(REQUEST_ANSWER, offer);
}

export function onRequestAnswer(ipc: IpcRenderer, callback: (offer: string) => void) {
  ipc.on(REQUEST_ANSWER, function (event, offer) {
    callback(offer);
  })
}


const RECEIVE_ANSWER = 'dc-receive-answer';

export function sendReceiveAnswer(ipc: IpcRenderer, answer: string) {
  ipc.send(RECEIVE_ANSWER, answer);
}

export function onReceiveAnswer(ipc: IpcMain, callback: (answer: string) => void) {
  ipc.on(RECEIVE_ANSWER, function (event, answer) {
    callback(answer);
  });
}


const GIVE_ANSWER = 'dc-give-answer';

export function sendGiveAnswer(window: BrowserWindow, answer: string) {
  window.webContents.send(GIVE_ANSWER, answer);
}

export function onGiveAnswer(ipc: IpcRenderer, callback: (answer: string) => void) {
  ipc.on(GIVE_ANSWER, function (event, answer) {
    callback(answer);
  });
}


const SCREEN_SIZE = 'dc-screensize';

export function sendScreenSize(ipc: IpcRenderer, height: number, width: number) {
  ipc.send(SCREEN_SIZE, {height, width});
}

export function onScreenSize(ipc: IpcMain, callback: (height: number, width: number) => void) {
  ipc.on(SCREEN_SIZE, function(event, dimensions) {
    callback(dimensions.height, dimensions.width);
  });
}


const EXTERNAL_KEYBOARD_REQ = 'dc-external-keyboard-req';

export function sendExternalKeyboardRequest(ipc: IpcRenderer) {
  ipc.send(EXTERNAL_KEYBOARD_REQ);
}

export function onExternalKeyboardRequest(ipc: IpcMain, callback: () => void) {
  ipc.on(EXTERNAL_KEYBOARD_REQ, function() {
    callback();
  });
}


const EXTERNAL_KEYBOARD_RES = 'dc-external-keyboard-res';

export function sendExternalKeyboardResponse(window: BrowserWindow, externalKeyboard: boolean) {
  window.webContents.send(EXTERNAL_KEYBOARD_RES, externalKeyboard);
}

export function onExternalKeyboardResponse(ipc: IpcRenderer, callback: (externalKeyboard: boolean) => void) {
  ipc.on(EXTERNAL_KEYBOARD_RES, function(event, externalKeyboard) {
    callback(externalKeyboard);
  });
}


const CONNECTION_STATE_CHANGED = 'dc-connection-state-changed';

export function sendConnectionStateChanged(ipc: IpcRenderer, connected: boolean) {
  ipc.send(CONNECTION_STATE_CHANGED, connected);
}

export function onConnectionStateChanged(ipc: IpcMain, callback: (connected: boolean) => void) {
  ipc.on(CONNECTION_STATE_CHANGED, function(event, connected) {
    callback(connected);
  });
}


const READY_TO_HOST = 'dc-ready-to-host';

export function sendReadyToHost(window: BrowserWindow, iceServers: any[]) {
  window.webContents.send(READY_TO_HOST, iceServers);
}

export function onReadyToHost(ipc: IpcRenderer, callback: (iceServers: any[]) => void) {
  ipc.on(READY_TO_HOST, function(event, iceServers) {
    callback(iceServers);
  });
}


const READY_TO_JOIN = 'dc-ready-to-join';

export function sendReadyToJoin(window: BrowserWindow, iceServers: any[]) {
  window.webContents.send(READY_TO_JOIN, iceServers);
}

export function onReadyToJoin(ipc: IpcRenderer, callback: (iceServers: any[]) => void) {
  ipc.on(READY_TO_JOIN, function(event, iceServers) {
    callback(iceServers);
  });
}
