import { app, BrowserWindow, Menu, ipcMain as ipc } from 'electron';
import * as menubar from 'menubar';

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow

const template = [
    {
        label: 'Edit',
        submenu: [
            {role: 'copy'},
            {role: 'paste'},
            {role: 'quit'},
        ]
    },
]

const menu = Menu.buildFromTemplate(template)

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 600})

    // and load the displaychampion.html of the app.
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'displaychampion.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })

    Menu.setApplicationMenu(menu)

  // createWebRtcInternalsWindow();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const receptionWindow = menubar({
    icon: path.join(__dirname, 'icons', 'idle.png'),
    index: 'file://' + path.join(__dirname, 'reception', 'dist', 'index.electron.html')
});

receptionWindow.on('after-create-window', function () {
    receptionWindow.window.webContents.openDevTools()
});

ipc.on('request-offer', function (event) {
    console.log('$$$$ Getting offer from DisplayChampion...');

    mainWindow.webContents.send('dc-request-offer');

    ipc.on('dc-receive-offer', function (_event, offer) {
        console.log('$$$# Offer retrieved from DC')
        event.sender.send('receive-offer', offer);
    });
});

ipc.on('request-answer', function (event, offer) {
    console.log('$$$$ Get answer from DisplayChampion...');

    mainWindow.webContents.send('dc-request-answer', offer);

    ipc.on('dc-receive-answer', function (_event, answer) {
        event.sender.send('receive-answer', answer);
    });
});

ipc.on('give-answer', function (event, answer) {
    mainWindow.webContents.send('dc-give-answer', answer);
});

function createWebRtcInternalsWindow() {
  const webRtcWindow = new BrowserWindow({width: 800, height: 600});
  webRtcWindow.loadURL('chrome://webrtc-internals');
  return webRtcWindow;
}
