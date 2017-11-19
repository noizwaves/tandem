import {IpcMain, IpcRenderer, BrowserWindow} from 'electron';


const REQUEST_OFFER = 'request-offer';

export function sendRequestOffer(ipc: IpcRenderer) {
  ipc.send(REQUEST_OFFER);
}

export function onRequestOffer(ipc: IpcMain, callback: () => void) {
  ipc.on(REQUEST_OFFER, function () {
    callback();
  });
}


const RECEIVE_OFFER = 'receive-offer';

export function sendReceiveOffer(window: BrowserWindow, offer: string) {
  window.webContents.send(RECEIVE_OFFER, offer);
}

export function onReceiveOffer(ipc: IpcRenderer, callback: (offer: string) => void) {
  ipc.on(RECEIVE_OFFER, function (event, offer) {
    callback(offer);
  });
}


const REQUEST_ANSWER = 'request-answer';

export function sendRequestAnswer(ipc: IpcRenderer, offer: string) {
  ipc.send(REQUEST_ANSWER, offer);
}

export function onRequestAnswer(ipc: IpcMain, callback: (offer: string) => void) {
  ipc.on(REQUEST_ANSWER, function (event, offer) {
    callback(offer)
  });
}


const RECEIVE_ANSWER = 'receive-answer';

export function sendReceiveAnswer(window: BrowserWindow, answer: string) {
  window.webContents.send(RECEIVE_ANSWER, answer);
}

export function onReceiveAnswer(ipc: IpcMain, callback: (answer: string) => void) {
  ipc.on(RECEIVE_ANSWER, function(event, answer) {
    callback(answer);
  });
}


const GIVE_ANSWER = 'give-answer';

export function sendGiveAnswer(ipc: IpcRenderer, answer: string) {
  ipc.send(GIVE_ANSWER, answer);
}

export function onGiveAnswer(ipc: IpcMain, callback: (answer: string) => void) {
  ipc.on(GIVE_ANSWER, function(event, answer) {
    callback(answer);
  })
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
}