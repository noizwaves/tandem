import { ipcRenderer as ipc } from 'electron';

require('./style/main.scss');

require('./index.electron.html');

const Elm = require('./Main.elm');
const mountNode = document.getElementById('main');

const app = Elm.Main.embed(mountNode);


// const ipc = require('electron').ipcRenderer;

app.ports.requestOffer.subscribe(function () {
    ipc.send('request-offer');
});

ipc.on('receive-offer', (event, offer) => {
    // console.log('$$$$ Offer created, sending to Elm');
    app.ports.receiveOffer.send(offer);
});

app.ports.requestAnswer.subscribe(function (offer) {
    ipc.send('request-answer', offer);
});

ipc.on('receive-answer', function (event, answer) {
    console.log('$$$$ Answer created, sending to Elm');
    app.ports.receiveAnswer.send(answer);
});

app.ports.giveAnswer.subscribe(function(answer) {
    ipc.send('give-answer', answer);
});
