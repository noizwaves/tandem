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


const CONNECTION_STATE_CHANGED = 'connection-state-changed';

export function sendConnectionStateChanged(window: BrowserWindow, connected: boolean) {
  window.webContents.send(CONNECTION_STATE_CHANGED, connected);
}

export function onConnectionStateChanged(ipc: IpcRenderer, callback: (connected: boolean) => void) {
  ipc.on(CONNECTION_STATE_CHANGED, function(event, connected) {
    callback(connected);
  });
}


const READY_TO_HOST = 'ready-to-host';

export function sendReadyToHost(ipc: IpcRenderer, iceServers: any[]) {
  ipc.send(READY_TO_HOST, iceServers);
}

export function onReadyToHost(ipc: IpcMain, callback: (iceServers: any[]) => void) {
  ipc.on(READY_TO_HOST, function(event, iceServers) {
    callback(iceServers);
  })
}

const READY_TO_JOIN = 'ready-to-join';

export function sendReadyToJoin(ipc: IpcRenderer, iceServers: any[]) {
  ipc.send(READY_TO_JOIN, iceServers);
}

export function onReadyToJoin(ipc: IpcMain, callback: (iceServers: any[]) => void) {
  ipc.on(READY_TO_JOIN, function(event, iceServers) {
    callback(iceServers);
  })
}


const REQUEST_PROCESS_TRUST = 'request-process-trust';

export function sendRequestProcessTrust(ipc: IpcRenderer) {
  ipc.send(REQUEST_PROCESS_TRUST);
}

export function onRequestProcessTrust(ipc: IpcMain, callback: () => void) {
  ipc.on(REQUEST_PROCESS_TRUST, function() {
    callback();
  });
}


const PROCESS_TRUST = 'process-trust';

export function sendProcessTrust(window: BrowserWindow, processTrust: boolean) {
  window.webContents.send(PROCESS_TRUST, processTrust);
}

export function onProcessTrust(ipc: IpcRenderer, callback: (processTrust: boolean) => void) {
  ipc.on(PROCESS_TRUST, function(event, processTrust) {
    callback(processTrust);
  });
}
