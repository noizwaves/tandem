import {desktopCapturer, ipcRenderer as ipc, IpcRenderer} from 'electron';

import * as Rx from 'rxjs';
import * as Peer from 'simple-peer';
import * as robot from 'robotjs';

import {KeyPresser, KeyUpEvent} from './keyboard';
import {KeyboardTransmitter, WindowTransmitter, ExternalTransmitter} from './src/keyboard-transmitter';

import * as DisplayChampionIPC from './displaychampion.ipc';
import * as PeerMsgs from './peer-msgs';
import {RobotKeyPresser} from './src/robot-key-presser';

const ICE_SERVERS = [
  // {url: 'stun:stun.l.google.com:19302'},
  // {url: 'stun:stun.services.mozilla.com'},
  // {urls: 'stun:global.stun.twilio.com:3478?transport=udp'},
  {urls: 'turn:crank.tandem.stream:3478?transport=udp', username: 'displaychampion', credential: '<SOME_PASSWORD_HERE>'},
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

  const keyPresser: KeyPresser = new RobotKeyPresser();

  p.on('connect', function () {
    console.log('[peer].CONNECT');

    PeerMsgs.sendScreenSize(peer, screen.height, screen.width);
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
      case PeerMsgs.MOUSEMOVE:
        const mouseMove = PeerMsgs.unpackMouseMove(message);
        robot.moveMouse(Math.round(mouseMove.x * screen.width), Math.round(mouseMove.y * screen.height));
        break;
      case PeerMsgs.MOUSEDOWN:
        const mouseDown = PeerMsgs.unpackMouseDown(message);
        robot.moveMouse(Math.round(mouseDown.x * screen.width), Math.round(mouseDown.y * screen.height));
        robot.mouseClick();
        break;
      case PeerMsgs.KEYUP:
        const {code, modifiers} = PeerMsgs.unpackKeyUp(message);
        keyPresser.press(code, modifiers);
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
        const xMove = mouseMove.x / mouseMove.width;
        const yMove = mouseMove.y / mouseMove.height;
        PeerMsgs.sendMouseMove(p, xMove, yMove);
      });

      transmitScreenMouseDownEvents(function (mouseDown) {
        const xDown = mouseDown.x / mouseDown.width;
        const yDown = mouseDown.y / mouseDown.height;
        PeerMsgs.sendMouseDown(p, xDown, yDown)
      });

      const keyPressTransmitter: KeyboardTransmitter = externalKeyboard
        ? new ExternalTransmitter(ipc)
        : new WindowTransmitter(window);

      keyPressTransmitter.keyUp.subscribe((e: KeyUpEvent) => {
        PeerMsgs.sendKeyUp(p, e.key, e.modifiers);
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
      case PeerMsgs.SCREEN_SIZE:
        const {height, width} = PeerMsgs.unpackScreenSize(message);
        DisplayChampionIPC.sendScreenSize(ipc, height, width);
        break;
      default:
        result = data;
    }

    return result;
  }

  return p;
}

let peer;

DisplayChampionIPC.onRequestOffer(ipc, function () {
  console.log('DC is getting an offer');
  getScreenStream(function (screenStream) {
    peer = createHostPeer(screenStream);

    peer.on('signal', function (data) {
      const offer = JSON.stringify(data);
      DisplayChampionIPC.sendReceiveOffer(ipc, offer);
    });
  });
});

DisplayChampionIPC.onRequestAnswer(ipc, function (offer) {
  console.log('DC is getting an answer...');
  show("#remote-screen");
  peer = createJoinPeer();

  peer.on('signal', function (data) {
    const answer = JSON.stringify(data);
    DisplayChampionIPC.sendReceiveAnswer(ipc, answer);
  });

  // accept the offer
  peer.signal(JSON.parse(offer));
});

DisplayChampionIPC.onGiveAnswer(ipc, function (answer) {
  // accept the answer
  peer.signal(JSON.parse(answer));
});

let externalKeyboard = false;
DisplayChampionIPC.onExternalKeyboardResponse(ipc, result => externalKeyboard = result);
DisplayChampionIPC.sendExternalKeyboardRequest(ipc);
