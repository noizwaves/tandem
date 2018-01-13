import {ipcRenderer as ipc} from 'electron';
import * as ReceptionIPC from '../../src/reception.ipc';

require('./style/main.scss');

require('./index.html');

const Elm = require('./Main.elm');
const mountNode = document.getElementById('main');

const app = Elm.Main.embed(mountNode, {
  online: navigator.onLine,
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


app.ports.requestProcessTrust.subscribe(function() {
  ReceptionIPC.RequestProcessTrust.send(ipc);
});

ReceptionIPC.ProcessTrust.on(ipc, function(processTrust: boolean) {
  app.ports.updateProcessTrust.send(processTrust);
});


app.ports.readyToHost.subscribe(function(nameInformation: NameInformation) {
  ReceptionIPC.ReadyToHost.send(ipc, nameInformation.iceServers);
});

app.ports.readyToJoin.subscribe(function(nameInformation: NameInformation) {
  ReceptionIPC.ReadyToJoin.send(ipc, nameInformation.iceServers);
});

app.ports.requestOffer.subscribe(function () {
  ReceptionIPC.RequestOffer.send(ipc);
});

ReceptionIPC.ReceiveOffer.on(ipc, (offer) => {
  app.ports.receiveOffer.send(offer);
});

app.ports.requestAnswer.subscribe(function (offer) {
  ReceptionIPC.RequestAnswer.send(ipc, offer);
});

ReceptionIPC.ReceiveAnswer.on(ipc, function (answer) {
  app.ports.receiveAnswer.send(answer);
});

app.ports.giveAnswer.subscribe(function (answer) {
  ReceptionIPC.GiveAnswer.send(ipc, answer);
});


ReceptionIPC.ConnectionStateChanged.on(ipc, function(connected) {
  app.ports.connectionStateChanged.send(connected);
});


window.addEventListener('online', () => app.ports.connectivityChanged.send(navigator.onLine));
window.addEventListener('offline', () => app.ports.connectivityChanged.send(navigator.onLine));
