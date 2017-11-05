import {app, BrowserWindow, ipcMain as ipc, Menu, Tray} from 'electron';

const path = require('path');
const url = require('url');

const trayMenu = Menu.buildFromTemplate([{role: 'quit'}]);

let displayChampionWindow: BrowserWindow;
let receptionWindow;
let tray: Tray;

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

  displayChampionWindow.on('closed', function () {
    displayChampionWindow = null
  });
}

function createReceptionWindow() {
  receptionWindow = new BrowserWindow({width: 400, height: 400});

  receptionWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'reception', 'dist', 'index.electron.html'),
    protocol: 'file:',
    slashes: true
  }));

  receptionWindow.on('after-create-window', function () {
    if (process.env.DEBUG_TOOLS) {
      receptionWindow.window.webContents.openDevTools();
    }
  });

  receptionWindow.on('closed', () => {
    receptionWindow = null
  });
}

function openWebRtcInternalsWindow() {
  const webRtcWindow = new BrowserWindow({width: 800, height: 600});
  webRtcWindow.loadURL('chrome://webrtc-internals');
  return webRtcWindow;
}

app.dock.setIcon(path.join(__dirname, 'icons', 'idle.png'));

if (process.env.DEBUG_TOOLS) {
  app.commandLine.appendSwitch('--enable-logging');
  app.commandLine.appendSwitch('--v', '1');
}

app.on('ready', () => {
  createReceptionWindow();
  createDisplayChampionWindow();

  if (process.env.DEBUG_TOOLS) {
    openWebRtcInternalsWindow();
  }

  tray = new Tray(path.join(__dirname, 'icons', 'idle.png'));
  tray.setContextMenu(trayMenu);
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

ipc.on('request-offer', function (event) {
  console.log('$$$$ Getting offer from DisplayChampion...');
  tray.setImage(path.join(__dirname, 'icons', 'busy.png'));

  displayChampionWindow.webContents.send('dc-request-offer');

  ipc.on('dc-receive-offer', function (_event, offer) {
    console.log('$$$# Offer retrieved from DC')
    event.sender.send('receive-offer', offer);
  });
});

ipc.on('request-answer', function (event, offer) {
  console.log('$$$$ Get answer from DisplayChampion...');
  tray.setImage(path.join(__dirname, 'icons', 'busy.png'));

  displayChampionWindow.show();
  displayChampionWindow.maximize();

  displayChampionWindow.webContents.send('dc-request-answer', offer);

  ipc.on('dc-receive-answer', function (_event, answer) {
    event.sender.send('receive-answer', answer);
  });
});

ipc.on('give-answer', function (event, answer) {
  displayChampionWindow.webContents.send('dc-give-answer', answer);
});

ipc.on('dc-screensize', function (event, dimensions) {
  if (displayChampionWindow) {
    displayChampionWindow.setAspectRatio(dimensions.width / dimensions.height, undefined);
  }
});
