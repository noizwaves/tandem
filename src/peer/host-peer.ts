import {ButtonType as CursorMoverButtonType, CursorMover} from '../cursor-mover';
import {KeyPresser} from '../keyboard';
import {RobotKeyMover} from '../robot-key-mover';
import {RobotCursorMover} from '../robot-cursor-mover';

import * as Peer from 'simple-peer';
import * as PeerMsgs from '../peer-msgs';
import * as Rx from 'rxjs/Rx';
import {preferVP8WithBoostedBitrate} from '../sdp-codec-adjuster';

import {getLogger} from '../logging';

const logger = getLogger();


export class HostPeer {
  public readonly offer: Rx.Observable<any>;
  public readonly connected: Rx.Observable<boolean>;

  private readonly keyPresser: KeyPresser;
  private readonly cursorMover: CursorMover;

  private readonly p: Peer;

  constructor(iceServers, screenStream) {
    const offer = new Rx.Subject<any>();
    this.offer = offer;

    const connected = new Rx.Subject<boolean>();
    this.connected = connected;

    this.keyPresser = new RobotKeyMover();
    this.cursorMover = new RobotCursorMover();

    const p = new Peer({
      config: {
        iceServers: iceServers
      },
      sdpTransform: preferVP8WithBoostedBitrate,
      initiator: true,
      trickle: false,
      stream: screenStream
    });

    p.on('signal', (data) => {
      offer.next(data);
    });

    p.on('connect', function () {
      logger.info('[peer] CONNECT');

      PeerMsgs.sendScreenSize(p, screen.height, screen.width);

      connected.next(true);
    });

    p.on('close', function () {
      logger.info('[peer] CLOSE');

      p.destroy();
      screenStream.getTracks().forEach(t => t.stop());

      connected.next(false);
    });

    p.on('error', function (err) {
      logger.error(`[peer] ERROR: ${err}`);
    });

    p.on('data', (data) => {
      const unhandled = this.handleMessage(data);
      if (unhandled) {
        logger.warnSensitive('[DisplayChampion] Unhandled data message', unhandled);
      }
    });

    this.p = p;
  }

  public acceptAnswer(answer): void {
    this.p.signal(answer);
  }

  private handleMessage(data: string) {
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
        this.cursorMover.move(mouseMoveMsg.x, mouseMoveMsg.y);
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

        this.cursorMover.buttonDown(mouseDownMsg.x, mouseDownMsg.y, downButtonType);
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

        this.cursorMover.buttonUp(mouseUpMsg.x, mouseUpMsg.y, upButtonType);
        break;
      case PeerMsgs.SCROLL:
        const scrollMsg = PeerMsgs.unpackScroll(message);
        this.cursorMover.scroll(scrollMsg.x, scrollMsg.y);
        break;
      case PeerMsgs.KEYUP:
        const keyUp = PeerMsgs.unpackKeyUp(message);
        this.keyPresser.pressUp(keyUp.code, keyUp.modifiers);
        break;
      case PeerMsgs.KEYDOWN:
        const keyDown = PeerMsgs.unpackKeyDown(message);
        this.keyPresser.pressDown(keyDown.code, keyDown.modifiers);
        break;
      default:
        result = data;
    }

    return result;
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

