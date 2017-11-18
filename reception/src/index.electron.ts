import {ipcRenderer as ipc} from 'electron';
import ReceptionIPC from '../../reception.ipc';

require('./style/main.scss');

require('./index.electron.html');

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
