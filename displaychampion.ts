import {desktopCapturer, ipcRenderer as ipc} from 'electron';

import * as Rx from 'rxjs';
import * as Peer from 'simple-peer';
import * as robot from 'robotjs';

const ICE_SERVERS = [
  // {url: 'stun:stun.l.google.com:19302'},
  // {url: 'stun:stun.services.mozilla.com'},
  // {urls: 'stun:global.stun.twilio.com:3478?transport=udp'},
  {urls: 'turn:54.219.175.205:3478?transport=udp', username: 'displaychampion', credential: '<SOME_PASSWORD_HERE>'},
];

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
  const heldModifiers = {};

  document.addEventListener('keydown', function (e: any) {
    if (isMeta(e.code)) {
      heldModifiers[e.code] = true;
      console.log(e.code + 'is down');
    }
  }, true);

  document.addEventListener('keyup', function (e: any) {
    if (isMeta(e.code)) {
      delete heldModifiers[e.code];
      console.log(e.code + 'is up');
    } else {
      keyboardCallback(e.code, Object.keys(heldModifiers));
    }
  }, true);
}

function isMeta(code: string): boolean {
  switch (code) {
    case 'ShiftLeft':
    case 'ShiftRight':
      return true;
    case 'ControlLeft':
    case 'ControlRight':
      return true;
    case 'AltLeft':
    case 'AltRight':
      return true;
    case 'MetaLeft':
    case 'MetaRight':
      return true;
    default:
      return false;
  }
}

function toRobotKey(code) {
  if (code.startsWith('Key')) {
    return code.substr(3).toLowerCase();
  } else if (code.startsWith('Digit')) {
    return code.substr(5);
  }

  switch (code) {
    case 'ShiftLeft':
    case 'ShiftRight':
      return 'shift';
    case 'ControlLeft':
    case 'ControlRight':
      return 'control';
    case 'AltLeft':
    case 'AltRight':
      return 'alt';
    case 'MetaLeft':
    case 'MetaRight':
      return 'command';
    case 'Space':
      return 'space';
    case 'Escape':
      return 'escape';
    case 'Enter':
      return 'enter';
    case 'Tab':
      return 'tab';
    case 'Backspace':
      return 'backspace';
    default:
      return code;
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
        console.log('received', message);
        console.log('robot.keyTap', toRobotKey(message.code), message.modifiers.map(toRobotKey));
        robot.keyTap(toRobotKey(message.code), message.modifiers.map(toRobotKey));
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

      transmitKeyboardEvents(function (code: string, modifiers: string[]) {
        const data = {t: 'keyup', code: code, modifiers: modifiers};
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
