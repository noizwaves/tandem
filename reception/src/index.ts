import {ipcRenderer as ipc, shell} from 'electron';
import * as ReceptionIPC from '../../src/reception.ipc';

import {getLogger} from '../../src/logging';

require('./style/main.scss');

require('./index.html');

const logger = getLogger();

const Elm = require('./Main.elm');
const mountNode = document.getElementById('main');

const app = Elm.Main.embed(mountNode, {
  online: navigator.onLine,
  apiUrl: 'wss://tandem-concierge.cfapps.io:4443/api/v1/session/',
  // apiUrl: 'ws://localhost:8080/api/v1/session/',
});

interface IceServerConfiguration {
  urls: string;
  username: string;
  credential: string;
}

interface NameInformation {
  iceServers: IceServerConfiguration[];
}

ReceptionIPC.UpdateAvailable.on(ipc, available => {
  app.ports.appUpdateAvailable.send(available);
});


app.ports.requestProcessTrust.subscribe(function () {
  ReceptionIPC.RequestProcessTrust.send(ipc);
});

ReceptionIPC.ProcessTrust.on(ipc, function (processTrust: boolean) {
  app.ports.updateProcessTrust.send(processTrust);
});

app.ports.openExternalWebsite.subscribe((websiteCode: string) => {
  const help = 'https://tandem.stream/help';
  switch (websiteCode) {
    case 'MacOsAccessibilityHow':
      shell.openExternal(`${help}/macos/how-to-enable-accessibility.html`);
      break;
    case 'MacOsAccessibilityWhy':
      shell.openExternal(`${help}/macos/why-tandem-needs-accessibility.html`);
      break;
    case 'MacOsUpdateInstructions':
      shell.openExternal(`${help}/macos/how-to-update.html`);
      break;
  }
});


app.ports.readyToHost.subscribe(function (nameInformation: NameInformation) {
  logger.debug(`[Reception] message on port readyToHost`);
  ReceptionIPC.ReadyToHost.send(ipc, nameInformation.iceServers);
});

app.ports.readyToJoin.subscribe(function (nameInformation: NameInformation) {
  logger.debug(`[Reception] message on port readyToJoin`);
  ReceptionIPC.ReadyToJoin.send(ipc, nameInformation.iceServers);
});

app.ports.requestOffer.subscribe(function () {
  logger.debug(`[Reception] message on requestOffer port`);
  ReceptionIPC.RequestOffer.send(ipc);
});

ReceptionIPC.ReceiveOffer.on(ipc, (offer) => {
  logger.debug(`[Reception] ReceptionIPC.ReceiveOffer received`);
  app.ports.receiveOffer.send(offer);
});

app.ports.requestAnswer.subscribe(function (offer) {
  logger.debug(`[Reception] message on requestAnswer port`);
  ReceptionIPC.RequestAnswer.send(ipc, offer);
});

ReceptionIPC.ReceiveAnswer.on(ipc, function (answer) {
  logger.debug(`[Reception] ReceptionIPC.ReceiveAnswer received`);
  app.ports.receiveAnswer.send(answer);
});

app.ports.giveAnswer.subscribe(function (answer) {
  logger.debug(`[Reception] message on giveAnswer port`);
  ReceptionIPC.GiveAnswer.send(ipc, answer);
});

ReceptionIPC.ConnectError.on(ipc, function(error) {
  logger.debug(`[Reception] ReceptionIPC.ConnectError("${error}") received`);
  app.ports.connectError.send(error);
});


app.ports.endSession.subscribe(function () {
  logger.debug(`[Reception] message on endSession port`);
  ReceptionIPC.EndSession.send(ipc);
});


ReceptionIPC.ConnectionStateChanged.on(ipc, function (connected) {
  logger.debug(`[Reception] ReceptionIPC.ConnectionStateChanged received`);
  app.ports.connectionStateChanged.send(connected);
});

ReceptionIPC.ConnectionStats.on(ipc, (stats) => {
  const jsonStats = JSON.stringify(stats);
  // logger.debugSensitive(`[Reception] ReceptionIPC.ConnectionStats forwarding stats to connectionStatsUpdated`, jsonStats);
  app.ports.connectionStatsUpdated.send(jsonStats);
});


window.addEventListener('online', () => app.ports.connectivityChanged.send(navigator.onLine));
window.addEventListener('offline', () => app.ports.connectivityChanged.send(navigator.onLine));
