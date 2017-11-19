import {desktopCapturer, ipcRenderer as ipc, IpcRenderer} from 'electron';

import * as Rx from 'rxjs';
import * as Peer from 'simple-peer';
import * as robot from 'robotjs';

import {KeyCode, KeyUpEvent, ModifierCode} from './keyboard';
import {KeyboardTransmitter, WindowTransmitter, ExternalTransmitter} from './src/keyboard-transmitter';

import * as DisplayChampionIPC from './displaychampion.ipc';
import * as PeerMsgs from './peer-msgs';

const ICE_SERVERS = [
  // {url: 'stun:stun.l.google.com:19302'},
  // {url: 'stun:stun.services.mozilla.com'},
  // {urls: 'stun:global.stun.twilio.com:3478?transport=udp'},
  {urls: 'turn:crank.tandem.stream:3478?transport=udp', username: 'displaychampion', credential: 'displaychampion'},
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

function toRobotKey(code: KeyCode): string {
  const codeStr = code.toString();
  if (codeStr.startsWith('Key')) {
    return codeStr.substr(3).toLowerCase();
  } else if (codeStr.startsWith('Digit')) {
    return codeStr.substr(5);
  } else if (codeStr.startsWith('F') && (codeStr.length === 2 || codeStr.length === 3)) {
    return codeStr.toLowerCase();
  }

  switch (code) {
    case KeyCode.ShiftLeft:
    case KeyCode.ShiftRight:
      return 'shift';
    case KeyCode.ControlLeft:
    case KeyCode.ControlRight:
      return 'control';
    case KeyCode.AltLeft:
    case KeyCode.AltRight:
      return 'alt';
    case KeyCode.MetaLeft:
    case KeyCode.MetaRight:
      return 'command';
    case KeyCode.Space:
      return 'space';
    case KeyCode.Escape:
      return 'escape';
    case KeyCode.Enter:
      return 'enter';
    case KeyCode.Tab:
      return 'tab';
    case KeyCode.Backspace:
      return 'backspace';
    case KeyCode.Delete:
      return 'delete';
    case KeyCode.ArrowRight:
      return 'right';
    case KeyCode.ArrowUp:
      return 'up';
    case KeyCode.ArrowLeft:
      return 'left';
    case KeyCode.ArrowDown:
      return 'down';

    case KeyCode.Home:
      return 'home';
    case KeyCode.End:
      return 'end';
    case KeyCode.PageUp:
      return 'pageup';
    case KeyCode.PageDown:
      return 'pagedown';

    case KeyCode.Numpad0:
      return 'numpad_0';
    case KeyCode.Numpad1:
      return 'numpad_1';
    case KeyCode.Numpad2:
      return 'numpad_2';
    case KeyCode.Numpad3:
      return 'numpad_3';
    case KeyCode.Numpad4:
      return 'numpad_4';
    case KeyCode.Numpad5:
      return 'numpad_5';
    case KeyCode.Numpad6:
      return 'numpad_6';
    case KeyCode.Numpad7:
      return 'numpad_7';
    case KeyCode.Numpad8:
      return 'numpad_8';
    case KeyCode.Numpad9:
      return 'numpad_9';

    // Unsupported
    case KeyCode.CapsLock:
      return null;
    case KeyCode.Function:
      return null;
    case KeyCode.Backslash:
      return null;
    case KeyCode.Comma:
      return null;
    case KeyCode.Equal:
      return null;
    case KeyCode.BracketLeft:
      return null;
    case KeyCode.Minus:
      return null;
    case KeyCode.Period:
      return null;
    case KeyCode.Quote:
      return '';
    case KeyCode.BracketRight:
      return null;
    case KeyCode.Semicolon:
      return null;
    case KeyCode.Slash:
      return null;

    default:
      return null;
  }
}

function toRobotKeyModifier(code: ModifierCode): string {
  switch (code) {
    case ModifierCode.ShiftLeft:
    case ModifierCode.ShiftRight:
      return 'shift';
    case ModifierCode.ControlLeft:
    case ModifierCode.ControlRight:
      return 'control';
    case ModifierCode.AltLeft:
    case ModifierCode.AltRight:
      return 'alt';
    case ModifierCode.MetaLeft:
    case ModifierCode.MetaRight:
      return 'command';
    default:
      return null;
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
        const robotKey = toRobotKey(code);
        if (!robotKey) {
          console.log(`RobotJS lacks support for ${message.code}`);
          break;
        }

        const robotModifiers = modifiers.map(toRobotKeyModifier);
        robot.keyTap(robotKey, robotModifiers);
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
