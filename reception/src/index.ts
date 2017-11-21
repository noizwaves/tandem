import {ipcRenderer as ipc} from 'electron';
import * as ReceptionIPC from '../../src/reception.ipc';

require('./style/main.scss');

require('./index.html');

const Elm = require('./Main.elm');
const mountNode = document.getElementById('main');

const app = Elm.Main.embed(mountNode);

interface IceServerConfiguration {
  urls: string;
  username: string;
  credential: string;
}

interface NameInformation {
  iceServers: IceServerConfiguration[];
}

app.ports.requestProcessTrust.subscribe(function() {
  ReceptionIPC.sendRequestProcessTrust(ipc);
});

ReceptionIPC.onProcessTrust(ipc, function(processTrust: boolean) {
  app.ports.updateProcessTrust.send(processTrust);
});

app.ports.readyToHost.subscribe(function(nameInformation: NameInformation) {
  ReceptionIPC.sendReadyToHost(ipc, nameInformation.iceServers);
});

app.ports.readyToJoin.subscribe(function(nameInformation: NameInformation) {
  ReceptionIPC.sendReadyToJoin(ipc, nameInformation.iceServers);
});

app.ports.requestOffer.subscribe(function () {
  ReceptionIPC.sendRequestOffer(ipc);
});

ReceptionIPC.onReceiveOffer(ipc, (offer) => {
  app.ports.receiveOffer.send(offer);
});

app.ports.requestAnswer.subscribe(function (offer) {
  ReceptionIPC.sendRequestAnswer(ipc, offer);
});

ReceptionIPC.onReceiveAnswer(ipc, function (answer) {
  app.ports.receiveAnswer.send(answer);
});

app.ports.giveAnswer.subscribe(function (answer) {
  ReceptionIPC.sendGiveAnswer(ipc, answer);
});

ReceptionIPC.onConnectionStateChanged(ipc, function(connected) {
  app.ports.connectionStateChanged.send(connected);
});
