import {desktopCapturer, ipcRenderer as ipc, IpcRenderer} from 'electron';

import * as Peer from 'simple-peer';

import {KeyDownEvent, KeyPresser, KeyUpEvent} from './keyboard';
import {ExternalTransmitter, KeyboardTransmitter, WindowTransmitter} from './keyboard-transmitter';

import {MouseButton, MouseButtonDetector, MouseButtonEvent} from './mouse-button';
import {MousePositionDetector} from './mouse-position';
import {MouseWheelDetector} from './mouse-wheel';

import {ButtonType as CursorMoverButtonType, CursorMover} from './cursor-mover';
import {RobotCursorMover} from './robot-cursor-mover';

import {RobotKeyMover} from './robot-key-mover';

import * as DisplayChampionIPC from './displaychampion.ipc';
import * as PeerMsgs from './peer-msgs';

import {getLogger} from './logging';

const logger = getLogger();


function getScreenStream(cb) {
  desktopCapturer.getSources({types: ['screen']}, (error, sources) => {
    logger.info(`[DisplayChampion] desktopCapture found ${sources.length} screen(s)`);

    if (sources.length === 0) {
      logger.error('[DisplayChampion] No screens found for sharing!');
    }

    const screenSource = sources[0];

    const video: MediaTrackConstraints = <MediaTrackConstraints> (<any> {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: screenSource.id,
        minWidth: screen.width,
        maxWidth: screen.width,
        minHeight: screen.height,
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
  });
}

function show(selector) {
  document.querySelector(selector).classList.remove('hidden');
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
  const cursorMover: CursorMover = new RobotCursorMover();

  p.on('connect', function () {
    logger.info('[peer] CONNECT');

    PeerMsgs.sendScreenSize(peer, screen.height, screen.width);

    DisplayChampionIPC.ConnectionStateChanged.send(ipc, true);
  });

  p.on('close', function () {
    logger.info('[peer] CLOSE');

    DisplayChampionIPC.ConnectionStateChanged.send(ipc, false);

    p.destroy();

    screenStream.getTracks().forEach(t => t.stop());
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
        const mouseMoveMsg = PeerMsgs.unpackMouseMove(message);
        cursorMover.move(mouseMoveMsg.x, mouseMoveMsg.y);
        break;
      case PeerMsgs.MOUSEDOWN:
        const mouseDownMsg = PeerMsgs.unpackMouseDown(message);

        let downButtonType: CursorMoverButtonType = null;
        try {
          downButtonType = toCursorMoverButtonType(mouseDownMsg.button);
        } catch (e) {
          logger.error(`[DisplayChampion] '${PeerMsgs.MOUSEDOWN}' error, ${e.message}`);
          return;
        }

        cursorMover.buttonDown(mouseDownMsg.x, mouseDownMsg.y, downButtonType);
        break;
      case PeerMsgs.MOUSEUP:
        const mouseUpMsg = PeerMsgs.unpackMouseUp(message);

        let upButtonType: CursorMoverButtonType = null;
        try {
          upButtonType = toCursorMoverButtonType(mouseUpMsg.button);
        } catch (e) {
          logger.error(`[DisplayChampion] '${PeerMsgs.MOUSEUP}' error, ${e.message}`);
          return;
        }

        cursorMover.buttonUp(mouseUpMsg.x, mouseUpMsg.y, upButtonType);
        break;
      case PeerMsgs.SCROLL:
        const scrollMsg = PeerMsgs.unpackScroll(message);
        cursorMover.scroll(scrollMsg.x, scrollMsg.y);
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
    const remoteScreen = <HTMLMediaElement> document.querySelector('#remote-screen');
    remoteScreen.srcObject = stream;
    remoteScreen.onloadedmetadata = function () {
      remoteScreen.play();

      const positionDetector = new MousePositionDetector(remoteScreen);
      positionDetector.position.subscribe(mouseMove => {
        const xMove = mouseMove.x / mouseMove.width;
        const yMove = mouseMove.y / mouseMove.height;
        PeerMsgs.sendMouseMove(p, xMove, yMove);
      });

      const buttonMsgSender = (event: MouseButtonEvent, sendButtonMessage: (peer, x: number, y: number, button: MouseButton) => void) => {
        const xDown = event.x / event.width;
        const yDown = event.y / event.height;

        let msgButton: PeerMsgs.MouseButton = null;
        try {
          msgButton = toMessageButtonType(event.button);
        } catch (e) {
          logger.error(`[DisplayChampion] Error getting message button type: ${e.message}`);
          return;
        }

        sendButtonMessage(p, xDown, yDown, msgButton);
      };
      const buttonDetector = new MouseButtonDetector(remoteScreen);
      buttonDetector.down.subscribe((e) => buttonMsgSender(e, PeerMsgs.sendMouseDown));
      buttonDetector.up.subscribe((e) => buttonMsgSender(e, PeerMsgs.sendMouseUp));

      const wheelDetector = new MouseWheelDetector(remoteScreen);
      wheelDetector.wheelChange.subscribe((wheelDelta) => {
        PeerMsgs.sendScroll(p, -1 * wheelDelta.deltaX, -1 * wheelDelta.deltaY);
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

function toMessageButtonType(button: MouseButton): PeerMsgs.MouseButton {
  switch (button) {
    case MouseButton.LEFT:
      return PeerMsgs.MouseButton.LEFT;
    case MouseButton.MIDDLE:
      return PeerMsgs.MouseButton.MIDDLE;
    case MouseButton.RIGHT:
      return PeerMsgs.MouseButton.RIGHT;
    default:
      throw new Error(`Unknown MouseButton value '${button}', cannot map`);
  }
}

function toCursorMoverButtonType(button: PeerMsgs.MouseButton): CursorMoverButtonType {
  switch (button) {
    case PeerMsgs.MouseButton.LEFT:
      return CursorMoverButtonType.LEFT;
    case PeerMsgs.MouseButton.MIDDLE:
      return CursorMoverButtonType.MIDDLE;
    case PeerMsgs.MouseButton.RIGHT:
      return CursorMoverButtonType.RIGHT;
    default:
      throw new Error(`Unknown message button type '${button}', cannot map`);
  }
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

    peer.on('close', function () {
      peer = null;
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

  peer.on('close', function () {
    peer = null;
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
