import {desktopCapturer, ipcRenderer as ipc} from 'electron';

import * as Rx from 'rxjs';
import * as Peer from 'simple-peer';
import * as robot from 'robotjs';

const ICE_SERVERS = [{
  url: 'stun:stun.l.google.com:19302'
}, {
  url: 'stun:stun.services.mozilla.com'
}, {
  urls: 'stun:global.stun.twilio.com:3478?transport=udp'
}];

function getScreenStream(cb) {
  const video: MediaTrackConstraints = <MediaTrackConstraints> (<any> {
    mandatory: {
      chromeMediaSource: 'screen',
      maxWidth: screen.width,
      maxHeight: screen.height,
      minFrameRate: 30
    }
  });
  navigator.mediaDevices.getUserMedia(
    {
      audio: false,
      video: video
    })
    .then(function (stream) {
      cb(stream)
    })
    .catch(function (err) {
      console.error('getUserMedia', err);
    });
}

function show(selector) {
  document.querySelector(selector).classList.remove('hidden');
}

function transmitScreenMouseEvents(mouseMoveCallback) {
  const remoteScreen = document.querySelector('#remote-screen');
  const movements = new Rx.Subject();

  remoteScreen.addEventListener('mousemove', function (event: any) {
    movements.next({
      x: event.offsetX,
      y: event.offsetY,
      width: remoteScreen.clientWidth,
      height: remoteScreen.clientHeight
    });
  });

  movements
    .throttle(e => Rx.Observable.interval(33))
    .subscribe(mouseMoveCallback);
}

function transmitScreenMouseDownEvents(mouseMoveCallback) {
  const remoteScreen = document.querySelector('#remote-screen');
  remoteScreen.addEventListener('mousedown', function (event: any) {
    mouseMoveCallback({
      x: event.offsetX,
      y: event.offsetY,
      width: remoteScreen.clientWidth,
      height: remoteScreen.clientHeight
    });
  })
}

function transmitKeyboardEvents(keyboardCallback) {
  document.addEventListener('keyup', function (e: any) {
      keyboardCallback(e.key);
    },
    true
  );
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

function preferH264(sdp: string): string {
  if (sdp.indexOf('SAVPF 96 98 100') >= 0) {
    return sdp.replace('SAVPF 96 98 100', 'SAVPF 100 98 96');
  }

  return sdp;
}

function createHostPeer(screenStream) {
  const p = new Peer({
    config: {
      iceServers: ICE_SERVERS
    },
    sdpTransform: preferH264,
    initiator: true,
    trickle: false,
    stream: screenStream
  });

  p.on('connect', function () {
    console.log('[peer].CONNECT');

    // send screen size
    const data = {t: 'screensize', h: screen.height, w: screen.width};
    p.send(JSON.stringify(data));
  });

  p.on('error', function (err) {
    console.log('[peer].ERROR', err);
  });

  p.on('data', function (data) {
    const unhandled = handleMessage(data);
    if (unhandled) {
      console.log('Unhandled data', unhandled);
    }
  });

  function handleMessage(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (err) {
      console.log(err);
    }
    if (!message || !message.t) {
      return;
    }

    let result = null;
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
  const p = new Peer({
    config: {
      iceServers: ICE_SERVERS
    },
    initiator: false,
    trickle: false
  });

  p.on('connect', function () {
    console.log('[peer].CONNECT');
  });

  p.on('error', function (err) {
    console.log('[peer].ERROR', err);
  });

  p.on('data', function (data) {
    const unhandled = handleMessageFromHost(data);
    if (unhandled) {
      console.log('Unhandled message', unhandled);
    }
  });

  p.on('stream', function (stream) {
    const remoteScreen: any = document.querySelector('#remote-screen');
    remoteScreen.srcObject = stream;
    remoteScreen.onloadedmetadata = function () {
      remoteScreen.play();

      transmitScreenMouseEvents(function (mouseMove) {
        const data = {t: 'mousemove', x: mouseMove.x / mouseMove.width, y: mouseMove.y / mouseMove.height};
        p.send(JSON.stringify(data));
      });

      transmitScreenMouseDownEvents(function (mouseDown) {
        const data = {t: 'mousedown', x: mouseDown.x / mouseDown.width, y: mouseDown.y / mouseDown.height};
        p.send(JSON.stringify(data));
      });

      transmitKeyboardEvents(function (key) {
        const data = {t: 'keyup', key: key};
        p.send(JSON.stringify(data));
      });
    }
  });

  function handleMessageFromHost(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (err) {
      console.log(err);
    }
    if (!message || !message.t) {
      return;
    }

    let result = null;
    switch (message.t) {
      case 'screensize':
        const height = message.h;
        const width = message.w;
        ipc.send('dc-screensize', {height, width});
        break;
      default:
        result = data;
    }

    return result;
  }

  return p;
}

let peer;

ipc.on('dc-request-offer', function (event) {
  console.log('DC is getting an offer');
  getScreenStream(function (screenStream) {
    peer = createHostPeer(screenStream);

    peer.on('signal', function (data) {
      const offer = JSON.stringify(data);
      event.sender.send('dc-receive-offer', offer);
    });
  });
});

ipc.on('dc-request-answer', function (event, offer) {
  console.log('DC is getting an answer...');
  show("#remote-screen");
  peer = createJoinPeer();

  peer.on('signal', function (data) {
    const answer = JSON.stringify(data);
    event.sender.send('dc-receive-answer', answer);
  });

  // accept the offer
  peer.signal(JSON.parse(offer));
});

ipc.on('dc-give-answer', function (event, answer) {
  // accept the answer
  peer.signal(JSON.parse(answer));
});
