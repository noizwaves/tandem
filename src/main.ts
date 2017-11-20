import {app, BrowserWindow, ipcMain as ipc, Menu, Tray} from 'electron';
import {deInit, MacOsKeyboard} from './macos';
import {Keyboard} from './keyboard';
import {sendKeyDown, sendKeyUp} from './keyboard.ipc';
import * as DisplayChampionIPC from './displaychampion.ipc';
import * as ReceptionIPC from './reception.ipc';

const path = require('path');
const url = require('url');

const minimalMenu = Menu.buildFromTemplate([{role: 'quit'}]);

let displayChampionWindow: BrowserWindow;
let receptionWindow: BrowserWindow;
let tray: Tray;

let sessionActive = false;

function getKeyboard(): Keyboard {
  if (process.platform === 'darwin') {
    return new MacOsKeyboard();
  }

  return null;
}

function createDisplayChampionWindow() {
  // Create the browser window.
  displayChampionWindow = new BrowserWindow({width: 800, height: 600, show: false});

  // and load the displaychampion.html of the app.
  displayChampionWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'displaychampion.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  if (process.env.DEBUG_TOOLS) {
    displayChampionWindow.show();
    displayChampionWindow.webContents.openDevTools();
  }

  const keyboard = getKeyboard();

  DisplayChampionIPC.onExternalKeyboardRequest(ipc, () => {
    DisplayChampionIPC.sendExternalKeyboardResponse(displayChampionWindow, keyboard !== null);
  });

  if (keyboard) {
    keyboard.keyUp.subscribe(e => sendKeyUp(displayChampionWindow, e));
    keyboard.keyDown.subscribe(e => sendKeyDown(displayChampionWindow, e));
  }

  displayChampionWindow.on('focus', function () {
    if (sessionActive && keyboard) {
      keyboard.plugIn();
    }
  });

  displayChampionWindow.on('blur', function () {
    if (sessionActive && keyboard) {
      keyboard.unplug();
    }
  });

  displayChampionWindow.on('closed', function () {
    deInit(); // TODO: encapsulate this tidy up inside MacOsKeyboard
    if (keyboard) {
      keyboard.unplug();
    }
    displayChampionWindow = null
  });
}

function createReceptionWindow() {
  receptionWindow = new BrowserWindow({width: 400, height: 400});

  receptionWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'reception', 'dist', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  receptionWindow.on('closed', () => {
    receptionWindow = null
  });

  // Open the DevTools.
  if (process.env.DEBUG_TOOLS) {
    receptionWindow.webContents.openDevTools();
  }
}

function openWebRtcInternalsWindow() {
  const webRtcWindow = new BrowserWindow({width: 800, height: 600});
  webRtcWindow.loadURL('chrome://webrtc-internals');
  return webRtcWindow;
}

app.dock.setIcon(path.join(__dirname, 'icons', 'idle.png'));
Menu.setApplicationMenu(minimalMenu);

if (process.env.DEBUG_TOOLS) {
  // app.commandLine.appendSwitch('--enable-logging');
  // app.commandLine.appendSwitch('--v', '1');
}

app.on('ready', () => {
  createReceptionWindow();
  createDisplayChampionWindow();

  if (process.env.DEBUG_TOOLS) {
    openWebRtcInternalsWindow();
  }

  tray = new Tray(path.join(__dirname, 'icons', 'idle.png'));
  tray.setContextMenu(minimalMenu);
});

app.on('window-all-closed', function () {// Quit when all windows are closed.
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  if (receptionWindow === null) {
    createReceptionWindow();
  }
});

// Host/client discovery
ReceptionIPC.onReadyToHost(ipc, function(iceServers) {
  DisplayChampionIPC.sendReadyToHost(displayChampionWindow, iceServers);
});

ReceptionIPC.onReadyToJoin(ipc, function(iceServers) {
  DisplayChampionIPC.sendReadyToJoin(displayChampionWindow, iceServers);
});

// Signalling/handshaking
ReceptionIPC.onRequestOffer(ipc, function () {
  console.log('$$$$ Getting offer from DisplayChampion...');
  tray.setImage(path.join(__dirname, 'icons', 'busy.png'));

  DisplayChampionIPC.sendRequestOffer(displayChampionWindow);

  DisplayChampionIPC.onReceiveOffer(ipc, function (offer) {
    console.log('$$$$ Offer retrieved from DC');
    ReceptionIPC.sendReceiveOffer(receptionWindow, offer);
  });
});

ReceptionIPC.onRequestAnswer(ipc, function (offer) {
  console.log('$$$$ Get answer from DisplayChampion...');
  tray.setImage(path.join(__dirname, 'icons', 'busy.png'));

  sessionActive = true;
  displayChampionWindow.show();
  displayChampionWindow.maximize();

  DisplayChampionIPC.sendRequestAnswer(displayChampionWindow, offer);

  DisplayChampionIPC.onReceiveAnswer(ipc, function (answer) {
    ReceptionIPC.sendReceiveAnswer(receptionWindow, answer);
  });
});

ReceptionIPC.onGiveAnswer(ipc, function (answer) {
  DisplayChampionIPC.sendGiveAnswer(displayChampionWindow, answer);
});

DisplayChampionIPC.onScreenSize(ipc, function (height, width) {
  if (displayChampionWindow) {
    displayChampionWindow.setAspectRatio(width / height, undefined);
  }
});

DisplayChampionIPC.onConnectionStateChanged(ipc, function(connected) {
  ReceptionIPC.sendConnectionStateChanged(receptionWindow, connected);
});
