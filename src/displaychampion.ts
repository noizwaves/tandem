import {desktopCapturer, ipcRenderer as ipc, IpcRenderer} from 'electron';

import * as Rx from 'rxjs';
import * as Peer from 'simple-peer';
import * as robot from 'robotjs';

import {KeyDownEvent, KeyPresser, KeyUpEvent} from './keyboard';
import {ExternalTransmitter, KeyboardTransmitter, WindowTransmitter} from './keyboard-transmitter';

import * as DisplayChampionIPC from './displaychampion.ipc';
import * as PeerMsgs from './peer-msgs';
import {RobotKeyMover} from './robot-key-mover';
import {getLogger} from './logging';

const logger = getLogger();

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
      logger.error(`getUserMedia: ${err}`);
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

function createHostPeer(iceServers, screenStream) {
  const p = new Peer({
    config: {
      iceServers: iceServers
    },
    initiator: true,
    trickle: false,
    stream: screenStream
  });

  const keyMover: KeyPresser = new RobotKeyMover();

  p.on('connect', function () {
    logger.info('[peer] CONNECT');

    PeerMsgs.sendScreenSize(peer, screen.height, screen.width);

    DisplayChampionIPC.ConnectionStateChanged.send(ipc, true);
  });

  p.on('close', function () {
    logger.info('[peer] CLOSE');

    DisplayChampionIPC.ConnectionStateChanged.send(ipc, false);
  });

  p.on('error', function (err) {
    logger.error(`[peer] ERROR: ${err}`);
  });

  p.on('data', function (data) {
    const unhandled = handleMessage(data);
    if (unhandled) {
      logger.warn(`Unhandled data message: ${unhandled}`);
    }
  });

  function handleMessage(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (err) {
      logger.error(`JSON parse failed: ${err}`);
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
        const keyUp = PeerMsgs.unpackKeyUp(message);
        keyMover.pressUp(keyUp.code, keyUp.modifiers);
        break;
      case PeerMsgs.KEYDOWN:
        const keyDown = PeerMsgs.unpackKeyDown(message);
        keyMover.pressDown(keyDown.code, keyDown.modifiers);
        break;
      default:
        result = data;
    }

    return result;
  }

  return p;
}

function createJoinPeer(iceServers) {
  const p = new Peer({
    config: {
      iceServers: iceServers
    },
    initiator: false,
    trickle: false
  });

  p.on('connect', function () {
    logger.info('[peer] CONNECT');

    DisplayChampionIPC.ConnectionStateChanged.send(ipc, true);
  });

  p.on('close', function () {
    logger.info('[peer] CLOSE');

    DisplayChampionIPC.ConnectionStateChanged.send(ipc, false);
  });

  p.on('error', function (err) {
    logger.warn(`[peer] ERROR: ${err}`);
  });

  p.on('data', function (data) {
    const unhandled = handleMessageFromHost(data);
    if (unhandled) {
      logger.warn(`Unhandled data message: ${unhandled}`);
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

      keyPressTransmitter.keyDown.subscribe((e: KeyDownEvent) => {
        PeerMsgs.sendKeyDown(p, e.key, e.modifiers);
      });
    }
  });

  function handleMessageFromHost(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (err) {
      logger.error(`JSON parse failed: ${err}`);
    }
    if (!message || !message.t) {
      return;
    }

    let result = null;
    switch (message.t) {
      case PeerMsgs.SCREEN_SIZE:
        const {height, width} = PeerMsgs.unpackScreenSize(message);
        DisplayChampionIPC.ScreenSize.send(ipc, {height, width});
        break;
      default:
        result = data;
    }

    return result;
  }

  return p;
}


let iceServers = null;
DisplayChampionIPC.ReadyToHost.on(ipc, function (hostIceServers) {
  iceServers = hostIceServers;
});

DisplayChampionIPC.ReadyToJoin.on(ipc, function (clientIceServers) {
  iceServers = clientIceServers;
});


let peer;
DisplayChampionIPC.RequestOffer.on(ipc, function () {
  getScreenStream(function (screenStream) {
    peer = createHostPeer(iceServers, screenStream);

    peer.on('signal', function (data) {
      const offer = JSON.stringify(data);
      DisplayChampionIPC.ReceiveOffer.send(ipc, offer);
    });
  });
});

DisplayChampionIPC.RequestAnswer.on(ipc, function (offer) {
  show("#remote-screen");
  peer = createJoinPeer(iceServers);

  peer.on('signal', function (data) {
    const answer = JSON.stringify(data);
    DisplayChampionIPC.ReceiveAnswer.send(ipc, answer);
  });

  // accept the offer
  peer.signal(JSON.parse(offer));
});

DisplayChampionIPC.GiveAnswer.on(ipc, function (answer) {
  // accept the answer
  peer.signal(JSON.parse(answer));
});


let externalKeyboard = false;
DisplayChampionIPC.ExternalKeyboardResponse.on(ipc, result => externalKeyboard = result);
DisplayChampionIPC.ExternalKeyboardRequest.send(ipc);
