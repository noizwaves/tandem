var Peer = require('simple-peer')
const getScreenStream = require('./get-screen-media')();

document.querySelector("#host").addEventListener('click', function (ev) {
    ev.preventDefault();

    title('Hosting');

    show("#connect-form");
    hide("#buttons");


    getScreenStream(function(screenStream) {
        establishConnection(screenStream);
    })

});

document.querySelector("#join").addEventListener('click', function (ev) {
    ev.preventDefault();

    title('Joining');

    show("#connect-form");
    hide("#buttons");
    show("#remote-screen");

    establishConnection();
});

function title(titleText) {
    document.querySelector('h1').innerText = titleText;
}

function show(selector) {
    document.querySelector(selector).classList.remove('hidden');
}

function hide(selector) {
    document.querySelector(selector).classList.add('hidden');
}

function transmitScreenMouseEvents(mouseMoveCallback) {
    const remoteScreen = document.querySelector('#remote-screen');
    remoteScreen.addEventListener('mousemove', function(event) {
        mouseMoveCallback({
            x: event.offsetX,
            y: event.offsetY,
            width: remoteScreen.clientWidth,
            height: remoteScreen.clientHeight
        });
    })
};

function establishConnection(screenStream) {
    const isHost = !!screenStream;
    const opts = {initiator: isHost, trickle: false};
    if (screenStream) {
        opts.stream = screenStream;
    }
    var p = new Peer(opts)

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

    p.on('stream', function(stream) {
        console.log('[peer,hosting=' + isHost + '].STREAM');
        const remoteScreen = document.querySelector('#remote-screen');
        remoteScreen.srcObject = stream
        remoteScreen.onloadedmetadata = function (e) {
            remoteScreen.play();
        }
        transmitScreenMouseEvents(function(mouseMove) {
            console.log('mousemove', mouseMove);
            const data = {t: 'mousemove', x: mouseMove.x / mouseMove.width, y: mouseMove.y / mouseMove.height};
            p.send(JSON.stringify(data));
        })
    })
}