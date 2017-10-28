var Peer = require('simple-peer')

document.querySelector("#host").addEventListener('click', function (ev) {
    ev.preventDefault();

    show("#connect-form");
    hide("#buttons");

    establishConnection(true);
});

document.querySelector("#join").addEventListener('click', function (ev) {
    ev.preventDefault();

    show("#connect-form");
    hide("#buttons");

    establishConnection(false);
});

function show(selector) {
    document.querySelector(selector).classList.remove('hidden');
}

function hide(selector) {
    document.querySelector(selector).classList.add('hidden');
}

function establishConnection(initiator) {
    var p = new Peer({initiator: initiator, trickle: false})

    p.on('error', function (err) {
        console.log('error', err)
    })

    p.on('signal', function (data) {
        console.log('[peer]SIGNAL', JSON.stringify(data))
        document.querySelector('#outgoing').textContent = JSON.stringify(data)
    })

    document.querySelector('form').addEventListener('submit', function (ev) {
        ev.preventDefault()
        p.signal(JSON.parse(document.querySelector('#incoming').value))
    })

    p.on('connect', function () {
        console.log('[peer].CONNECT')
        const chunk = 'whatever' + Math.random();
        p.send(chunk)
        document.querySelector('#data').textContent += "Sending: " + chunk + ";\n";
    })

    p.on('data', function (data) {
        console.log('[peer].DATA');
        document.querySelector('#data').textContent += "Received: " + data + ";\n";
    })
}