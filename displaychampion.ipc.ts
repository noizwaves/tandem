import {BrowserWindow, IpcMain, IpcRenderer} from 'electron';


const REQUEST_OFFER = 'dc-request-offer';

export function sendRequestOffer(window: BrowserWindow) {
  window.webContents.send(REQUEST_OFFER);
}

export function onRequestOffer(ipc: IpcRenderer, callback: (event: any) => void) {
  ipc.on(REQUEST_OFFER, function (event) {
    callback(event);
  });
}


const RECEIVE_OFFER = 'dc-receive-offer';

export function sendReceiveOffer(target, offer: string) {
  target.send(RECEIVE_OFFER, offer);
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

export function onRequestAnswer(ipc: IpcRenderer, callback: (event: any, offer: string) => void) {
  ipc.on(REQUEST_ANSWER, function (event, offer) {
    callback(event, offer);
  })
}

const RECEIVE_ANSWER = 'dc-receive-answer';

export function sendReceiveAnswer(target, answer: string) {
  target.send(RECEIVE_ANSWER, answer);
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

export default {
  sendRequestOffer,
  onRequestOffer,
  sendReceiveOffer,
  onReceiveOffer,
  sendRequestAnswer,
  onRequestAnswer,
  sendReceiveAnswer,
  onReceiveAnswer,
  sendGiveAnswer,
  onGiveAnswer,
  sendScreenSize,
  onScreenSize,
}
