import {app, BrowserWindow, ipcMain as ipc, Menu, Tray} from 'electron';
import * as Rx from 'rxjs';
import {deInit, MacOsKeyboard, MacOsSystemIntegrator} from './macos';
import {Keyboard} from './keyboard';
import {sendKeyDown, sendKeyUp} from './keyboard.ipc';
import * as DisplayChampionIPC from './displaychampion.ipc';
import * as ReceptionIPC from './reception.ipc';
import {NoopSystemIntegrator, SystemIntegrator} from './system-integrator';

const path = require('path');
const url = require('url');

const trayMenu = Menu.buildFromTemplate([{role: 'quit'}]);

const appMenu = Menu.buildFromTemplate([
  {
    label: app.getName(),
    submenu: [
      {role: 'quit'}
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  }
]);

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

function getSystemIntegrator(): SystemIntegrator {
  if (process.platform === 'darwin') {
    return new MacOsSystemIntegrator();
  }

  return new NoopSystemIntegrator();
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

  DisplayChampionIPC.ExternalKeyboardRequest.on(ipc, () => {
    DisplayChampionIPC.ExternalKeyboardResponse.send(displayChampionWindow, keyboard !== null);
  });

  if (keyboard) {
    keyboard.keyUp.subscribe(e => sendKeyUp(displayChampionWindow, e));
    keyboard.keyDown.subscribe(e => sendKeyDown(displayChampionWindow, e));
  }

  displayChampionWindow.on('focus', function () {
    Menu.setApplicationMenu(trayMenu);

    if (sessionActive && keyboard) {
      keyboard.plugIn();
    }
  });

  displayChampionWindow.on('blur', function () {
    Menu.setApplicationMenu(appMenu);

    if (sessionActive && keyboard) {
      keyboard.unplug();
    }
  });

  displayChampionWindow.on('closed', function () {
    Menu.setApplicationMenu(appMenu);

    deInit(); // TODO: encapsulate this tidy up inside MacOsKeyboard
    if (keyboard) {
      keyboard.unplug();
    }
    displayChampionWindow = null
  });
}

function createReceptionWindow() {
  const integrator = getSystemIntegrator();

  let trustSubscription: Rx.Subscription = null;

  receptionWindow = new BrowserWindow({width: 400, height: 400});

  receptionWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'reception', 'dist', 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  receptionWindow.on('closed', () => {
    if (trustSubscription !== null) {
      trustSubscription.unsubscribe();
    }
    receptionWindow = null
  });

  ReceptionIPC.RequestProcessTrust.on(ipc, function () {
    trustSubscription = integrator.trust.subscribe(trust => {
      ReceptionIPC.ProcessTrust.send(receptionWindow, trust);
    });
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
  tray.setContextMenu(trayMenu);

  Menu.setApplicationMenu(appMenu);
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
ReceptionIPC.ReadyToHost.on(ipc, function (iceServers) {
  DisplayChampionIPC.ReadyToHost.send(displayChampionWindow, iceServers);
});

ReceptionIPC.ReadyToJoin.on(ipc, function (iceServers) {
  DisplayChampionIPC.ReadyToJoin.send(displayChampionWindow, iceServers);
});

// Signalling/handshaking
ReceptionIPC.RequestOffer.on(ipc, function () {
  console.log('$$$$ Getting offer from DisplayChampion...');
  tray.setImage(path.join(__dirname, 'icons', 'busy.png'));

  DisplayChampionIPC.RequestOffer.send(displayChampionWindow);

  DisplayChampionIPC.ReceiveOffer.on(ipc, function (offer) {
    console.log('$$$$ Offer retrieved from DC');
    ReceptionIPC.ReceiveOffer.send(receptionWindow, offer);
  });
});

ReceptionIPC.RequestAnswer.on(ipc, function (offer) {
  console.log('$$$$ Get answer from DisplayChampion...');
  tray.setImage(path.join(__dirname, 'icons', 'busy.png'));

  sessionActive = true;
  displayChampionWindow.show();
  displayChampionWindow.maximize();

  DisplayChampionIPC.RequestAnswer.send(displayChampionWindow, offer);

  DisplayChampionIPC.ReceiveAnswer.on(ipc, function (answer) {
    ReceptionIPC.ReceiveAnswer.send(receptionWindow, answer);
  });
});

ReceptionIPC.GiveAnswer.on(ipc, function (answer) {
  DisplayChampionIPC.GiveAnswer.send(displayChampionWindow, answer);
});

DisplayChampionIPC.ScreenSize.on(ipc, function (dimensions) {
  const {height, width} = dimensions;
  if (displayChampionWindow) {
    displayChampionWindow.setAspectRatio(width / height, undefined);
  }
});

DisplayChampionIPC.ConnectionStateChanged.on(ipc, function (connected) {
  ReceptionIPC.ConnectionStateChanged.send(receptionWindow, connected);
});
