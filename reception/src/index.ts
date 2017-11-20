import {ipcRenderer as ipc} from 'electron';
import * as ReceptionIPC from '../../src/reception.ipc';

require('./style/main.scss');

require('./index.html');

const Elm = require('./Main.elm');
const mountNode = document.getElementById('main');

const app = Elm.Main.embed(mountNode);

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
