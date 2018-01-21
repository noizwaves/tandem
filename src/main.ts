import {app, BrowserWindow, ipcMain as ipc, Menu, Notification, screen as electronScreen, Tray} from 'electron';
import * as Rx from 'rxjs';
import {Keyboard} from './domain/keyboard';
import {KeyDownChannel, KeyUpChannel} from './keyboard.ipc';
import * as DisplayChampionIPC from './displaychampion.ipc';
import * as ReceptionIPC from './reception.ipc';
import {KeyboardFactory} from './platform/keyboard-factory';
import {SystemIntegratorFactory} from './platform/system-integrator-factory';
import {configureLogging, getLogger} from './logging';

import axios from 'axios';
import {UpdateChecker} from './update-checker';

const path = require('path');
const url = require('url');

configureLogging();

const logger = getLogger();

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

const dcMenu = Menu.buildFromTemplate([
  {
    label: app.getName(),
    submenu: [
      {role: 'quit'}
    ]
  }
]);

const keyboardFactory = new KeyboardFactory();
const systemIntegratorFactory = new SystemIntegratorFactory();

let displayChampionWindow: BrowserWindow;
let receptionWindow: BrowserWindow;
let tray: Tray;

let userSaysQuit = false;

let keyboard: Keyboard = null;

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
  if (isDebugToolsEnabled()) {
    displayChampionWindow.show();
    displayChampionWindow.webContents.openDevTools();
  }

  keyboard = keyboardFactory.getKeyboard();
  const keyDownChannel = new KeyDownChannel();
  const keyUpChannel = new KeyUpChannel();

  DisplayChampionIPC.ExternalKeyboardRequest.on(ipc, () => {
    DisplayChampionIPC.ExternalKeyboardResponse.send(displayChampionWindow, keyboard !== null);
  });

  if (keyboard) {
    keyboard.keyUp.subscribe(e => keyUpChannel.send(displayChampionWindow, e));
    keyboard.keyDown.subscribe(e => keyDownChannel.send(displayChampionWindow, e));
  }

  displayChampionWindow.on('focus', function () {
    Menu.setApplicationMenu(dcMenu);

    if (sessionAsJoiner && keyboard) {
      keyboard.plugIn();
    }
  });

  displayChampionWindow.on('blur', function () {
    Menu.setApplicationMenu(appMenu);

    if (sessionAsJoiner && keyboard) {
      keyboard.unplug();
    }
  });

  displayChampionWindow.on('closed', function () {
    Menu.setApplicationMenu(appMenu);

    if (keyboard) {
      keyboard.unplug();
    }
    displayChampionWindow = null;
    keyDownChannel.dispose();
    keyUpChannel.dispose();
  });

  displayChampionWindow.on('close', e => {
    DisplayChampionIPC.CloseSession.send(displayChampionWindow);

    if (!userSaysQuit) {
      e.preventDefault();

      if (displayChampionWindow.isFullScreen()) {
        displayChampionWindow.once('leave-full-screen', () => {
          displayChampionWindow.hide();
        });
        displayChampionWindow.setFullScreen(false);
      } else {
        displayChampionWindow.hide();
      }
    }
  });

  displayChampionWindow.on('enter-full-screen', () => {
    const holdingScreen = electronScreen.getDisplayMatching(displayChampionWindow.getBounds());
    const {height, width} = holdingScreen.size;

    DisplayChampionIPC.EnterFullScreen.send(displayChampionWindow, {height, width});
  });

  displayChampionWindow.on('leave-full-screen', () => {
    DisplayChampionIPC.LeaveFullScreen.send(displayChampionWindow);
  });
}

function createReceptionWindow() {
  const integrator = systemIntegratorFactory.getSystemIntegrator();

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
    receptionWindow = null;
  });

  ReceptionIPC.RequestProcessTrust.on(ipc, function () {
    trustSubscription = integrator.trust.subscribe(trust => {
      ReceptionIPC.ProcessTrust.send(receptionWindow, trust);
    });
  });

  // Open the DevTools.
  if (isDebugToolsEnabled()) {
    receptionWindow.webContents.openDevTools();
  }

  receptionWindow.webContents.once('dom-ready', () => {
    checkForUpdates();
  });
}

function openGpuInternalsWindow() {
  const gpuWindow = new BrowserWindow({width: 800, height: 600});
  gpuWindow.loadURL('chrome://gpu');
  return gpuWindow;
}

function openWebRtcInternalsWindow() {
  const webRtcWindow = new BrowserWindow({width: 800, height: 600});
  webRtcWindow.loadURL('chrome://webrtc-internals');
  return webRtcWindow;
}

function checkForUpdates() {
  const currentVersion = app.getVersion();
  const checker = new UpdateChecker(axios, currentVersion);

  logger.info(`[main] Current version ${currentVersion}, checking for updates`);

  checker.isUpdateAvailable().then(updateAvailable => {
    logger.info(`[main] Updates available: ${updateAvailable}`);
    ReceptionIPC.UpdateAvailable.send(receptionWindow, updateAvailable);
  });
}


app.commandLine.appendSwitch('--disable-renderer-backgrounding');
if (isDebugToolsEnabled()) {
  // app.commandLine.appendSwitch('--enable-logging');
  // app.commandLine.appendSwitch('--v', '1');
}

app.on('ready', () => {
  createReceptionWindow();
  createDisplayChampionWindow();

  if (isDebugWindowsEnabled()) {
    openWebRtcInternalsWindow();
    openGpuInternalsWindow();
  }

  tray = new Tray(path.join(__dirname, 'icons', 'idle.png'));
  tray.setContextMenu(trayMenu);

  Menu.setApplicationMenu(appMenu);
});

app.on('window-all-closed', function () {// Quit when all windows are closed.
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (receptionWindow === null) {
    createReceptionWindow();
  }
});

app.on('before-quit', () => {
  userSaysQuit = true;
});

// Host/client discovery
let sessionAsJoiner = false;
let sessionAsHost = false;

ReceptionIPC.ReadyToHost.on(ipc, function (iceServers) {
  DisplayChampionIPC.ReadyToHost.send(displayChampionWindow, iceServers);
});

ReceptionIPC.ReadyToJoin.on(ipc, function (iceServers) {
  DisplayChampionIPC.ReadyToJoin.send(displayChampionWindow, iceServers);
});

// Signalling/handshaking
ReceptionIPC.RequestOffer.on(ipc, function () {
  logger.info('[main] Getting offer from DisplayChampion...');
  tray.setImage(path.join(__dirname, 'icons', 'busy.png'));

  sessionAsHost = true;

  DisplayChampionIPC.RequestOffer.send(displayChampionWindow);
});

DisplayChampionIPC.ReceiveOffer.on(ipc, function (offer) {
  logger.info('[main] Offer retrieved from Display Champion');

  ReceptionIPC.ReceiveOffer.send(receptionWindow, offer);
});

ReceptionIPC.RequestAnswer.on(ipc, function (offer) {
  logger.info('[main] Get answer from DisplayChampion...');
  tray.setImage(path.join(__dirname, 'icons', 'busy.png'));

  sessionAsJoiner = true;
  displayChampionWindow.show();

  DisplayChampionIPC.RequestAnswer.send(displayChampionWindow, offer);
});

DisplayChampionIPC.ReceiveAnswer.on(ipc, function (answer) {
  ReceptionIPC.ReceiveAnswer.send(receptionWindow, answer);
});

ReceptionIPC.GiveAnswer.on(ipc, function (answer) {
  logger.info('[main] Answer retrieved from DisplayChampion');
  DisplayChampionIPC.GiveAnswer.send(displayChampionWindow, answer);
});

DisplayChampionIPC.ScreenSize.on(ipc, function (dimensions) {
  const {height, width} = dimensions;
  if (displayChampionWindow) {
    displayChampionWindow.setAspectRatio(width / height, undefined);

    const displayChampionScreen = electronScreen.getDisplayMatching(displayChampionWindow.getBounds());
    if (width > displayChampionScreen.size.width || height > displayChampionScreen.size.height) {
      displayChampionWindow.maximize();
    } else {
      displayChampionWindow.setContentSize(width, height);
    }

    displayChampionWindow.center();
  }
});

DisplayChampionIPC.ConnectionStateChanged.on(ipc, function (connected) {
  ReceptionIPC.ConnectionStateChanged.send(receptionWindow, connected);

  if (sessionAsHost) {
    if (connected) {
      const connectedNotification = new Notification({
        title: 'Session started',
        body: 'Your pair has connected',
      });
      connectedNotification.show();
    } else {
      const disconnectedNotification = new Notification({
        title: 'Session ended',
        body: 'Your pair has disconnected',
      });
      disconnectedNotification.show();
    }
  }

  if (!connected) {
    if (sessionAsJoiner) {
      // TODO: encapsulate this inside of a DisplayChampion Window class
      if (keyboard) {
        keyboard.unplug();
      }
      displayChampionWindow.hide();
    }

    logger.info('[main] Disconnected');
    sessionAsJoiner = false;
    sessionAsHost = false;

    tray.setImage(path.join(__dirname, 'icons', 'idle.png'));
  }
});

DisplayChampionIPC.ConnectionStats.on(ipc, (stats) => {
  ReceptionIPC.ConnectionStats.send(receptionWindow, stats);
});

function isDebugToolsEnabled() {
  const raw = process.env.TANDEM_DEBUG_TOOLS;
  const sanitised = (raw || '').toLowerCase();

  return sanitised === 'true';
}

function isDebugWindowsEnabled() {
  const raw = process.env.TANDEM_DEBUG_WINDOWS;
  const sanitised = (raw || '').toLowerCase();

  return sanitised === 'true';
}
