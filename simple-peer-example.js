var Peer = require('simple-peer')
const getScreenStream = require('./get-screen-media')();
const robot = require("robotjs");
const ipc = require("electron").ipcRenderer;

document.querySelector("#host").addEventListener('click', function (ev) {
    ev.preventDefault();

    title('Hosting');

    show("#connect-form");
    hide("#buttons");


    getScreenStream(function (screenStream) {
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
    remoteScreen.addEventListener('mousemove', function (event) {
        mouseMoveCallback({
            x: event.offsetX,
            y: event.offsetY,
            width: remoteScreen.clientWidth,
            height: remoteScreen.clientHeight
        });
    })
};

function transmitScreenMouseDownEvents(mouseMoveCallback) {
    const remoteScreen = document.querySelector('#remote-screen');
    remoteScreen.addEventListener('mousedown', function (event) {
        mouseMoveCallback({
            x: event.offsetX,
            y: event.offsetY,
            width: remoteScreen.clientWidth,
            height: remoteScreen.clientHeight
        });
    })
};

function transmitKeyboardEvents(keyboardCallback) {
    document.addEventListener('keyup', function (e) {
            keyboardCallback(e.key);
        },
        true
    );

    // document.addEventListener('keydown',
    //     function(e) { console.log('keydown capture', e); },
    //     true /* grab event on tunnel, not on bubble */);
}

function toRobotKey(key) {
    switch (key) {
        case 'Escape':
            return 'escape';
        case 'Shift':
            return 'shift';
        case ' ':
            return 'space';
        case 'Enter':
            return 'enter';
        case 'Tab':
            return 'tab';
        case 'Control':
            return 'control';
        case 'Alt':
            return 'alt';
        case 'Meta':
            return 'command';
        case 'Backspace':
            return 'backspace';
        default:
            return key;
    }
}


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
    })

    p.on('data', function (data) {
        console.log('[peer].DATA');
        const unhandled = handleMessage(data);
        if (unhandled) {
            document.querySelector('#data').textContent += "Received: " + data + ";\n";
        }
    })

    p.on('stream', function (stream) {
        console.log('[peer,hosting=' + isHost + '].STREAM');
        const remoteScreen = document.querySelector('#remote-screen');
        remoteScreen.srcObject = stream
        remoteScreen.onloadedmetadata = function (e) {
            remoteScreen.play();
            if (!isHost) {
                transmitScreenMouseEvents(function (mouseMove) {
                    const data = {t: 'mousemove', x: mouseMove.x / mouseMove.width, y: mouseMove.y / mouseMove.height};
                    p.send(JSON.stringify(data));
                })
                transmitScreenMouseDownEvents(function (mouseDown) {
                    const data = {t: 'mousedown', x: mouseDown.x / mouseDown.width, y: mouseDown.y / mouseDown.height};
                    p.send(JSON.stringify(data));
                })
                transmitKeyboardEvents(function (key) {
                    const data = {t: 'keyup', key: key};
                    p.send(JSON.stringify(data));
                })
            }

            hide('#title');
            hide("#connect-form");
        }

    })

    function handleMessage(data) {
        var message;
        try {
            message = JSON.parse(data);
        } catch (err) {
            console.log(err);
        }
        if (!message || !message.t) {
            return;
        }

        var result = null;
        switch (message.t) {
            case 'mousemove':
                robot.moveMouse(Math.round(message.x * screen.width), Math.round(message.y * screen.height));
                break;
            case 'mousedown':
                robot.moveMouse(Math.round(message.x * screen.width), Math.round(message.y * screen.height));
                robot.mouseClick();
                break;
            case 'keyup':
                robot.keyTap(toRobotKey(message.key));
                break;
            default:
                result = data;
        }

        return result;
    }
}


function createHostPeer(screenStream) {
    var p = new Peer({initiator: true, trickle: false, stream: screenStream});

    p.on('connect', function () {
        console.log('[peer].CONNECT')
    });

    p.on('error', function (err) {
        console.log('error', err)
    });

    p.on('data', function (data) {
        console.log('[peer].DATA');
        const unhandled = handleMessage(data);
        if (unhandled) {
            document.querySelector('#data').textContent += "Received: " + data + ";\n";
        }
    })

    function handleMessage(data) {
        var message;
        try {
            message = JSON.parse(data);
        } catch (err) {
            console.log(err);
        }
        if (!message || !message.t) {
            return;
        }

        var result = null;
        switch (message.t) {
            case 'mousemove':
                robot.moveMouse(Math.round(message.x * screen.width), Math.round(message.y * screen.height));
                break;
            case 'mousedown':
                robot.moveMouse(Math.round(message.x * screen.width), Math.round(message.y * screen.height));
                robot.mouseClick();
                break;
            case 'keyup':
                robot.keyTap(toRobotKey(message.key));
                break;
            default:
                result = data;
        }

        return result;
    }

    return p;
}

function createJoinPeer() {
    var p = new Peer({initiator: false, trickle: false});

    p.on('connect', function () {
        console.log('[peer].CONNECT')
    });

    p.on('error', function (err) {
        console.log('error', err)
    });

    p.on('stream', function (stream) {
        console.log('[peer.STREAM]');
        const remoteScreen = document.querySelector('#remote-screen');
        remoteScreen.srcObject = stream
        remoteScreen.onloadedmetadata = function (e) {
            remoteScreen.play();
            transmitScreenMouseEvents(function (mouseMove) {
                const data = {t: 'mousemove', x: mouseMove.x / mouseMove.width, y: mouseMove.y / mouseMove.height};
                p.send(JSON.stringify(data));
            })
            transmitScreenMouseDownEvents(function (mouseDown) {
                const data = {t: 'mousedown', x: mouseDown.x / mouseDown.width, y: mouseDown.y / mouseDown.height};
                p.send(JSON.stringify(data));
            })
            transmitKeyboardEvents(function (key) {
                const data = {t: 'keyup', key: key};
                p.send(JSON.stringify(data));
            })

        }

    })

    return p;
}

var peer;

ipc.on('dc-request-offer', function (event) {
    console.log('DC is starting up!');

    hide("#buttons");
    hide("#remote-screen");
    hide('#title');
    hide("#connect-form");

    getScreenStream(function (screenStream) {
        peer = createHostPeer(screenStream);

        peer.on('signal', function (data) {
            var offer = JSON.stringify(data);
            event.sender.send('dc-receive-offer', offer);
        })
    })
});

ipc.on('dc-request-answer', function (event, offer) {
    console.log('DC is getting an answer...');

    hide("#buttons");
    show("#remote-screen");
    hide('#title');
    hide("#connect-form");

    peer = createJoinPeer();

    peer.on('signal', function (data) {
        var answer = JSON.stringify(data);
        event.sender.send('dc-receive-answer', answer);
    })

    peer.signal(JSON.parse(offer));
});

ipc.on('dc-give-answer', function (event, answer) {
    peer.signal(JSON.parse(answer));
});
