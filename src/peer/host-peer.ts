import {ButtonType as CursorMoverButtonType, CursorMover} from '../domain/cursor-mover';
import {KeyPresser} from '../domain/key-presser';
import {RobotKeyPresser} from '../platform/robot-key-presser';
import {RobotCursorMover} from '../platform/robot-cursor-mover';

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

    this.keyPresser = new RobotKeyPresser();
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
      logger.info('[HostPeer] CONNECT');

      PeerMsgs.ScreenSize.send(p, {height: screen.height, width: screen.width});

      connected.next(true);
    });

    p.on('close', function () {
      logger.info('[HostPeer] CLOSE');

      screenStream.getTracks().forEach(t => t.stop());

      connected.next(false);
    });

    p.on('error', function (err) {
      logger.error(`[HostPeer] ERROR: ${err}`);
    });

    p.on('data', (data) => {
      const unhandled = this.handleMessage(data);
      if (unhandled) {
        logger.warnSensitive('[HostPeer] Unhandled data message', unhandled);
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
      logger.errorSensitive('[HostPeer] JSON parse failed', err);
    }
    if (!message || !message.t) {
      return;
    }

    let result = null;
    // Leaky abstraction for how type is encoded :(
    switch (message.t) {
      case PeerMsgs.MouseMove.type:
        const mouseMoveMsg = PeerMsgs.MouseMove.unpack(message);
        this.cursorMover.move(mouseMoveMsg.x, mouseMoveMsg.y);
        break;
      case PeerMsgs.MouseDown.type:
        const mouseDownMsg = PeerMsgs.MouseDown.unpack(message);

        let downButtonType: CursorMoverButtonType = null;
        try {
          downButtonType = toCursorMoverButtonType(mouseDownMsg.button);
        } catch (e) {
          logger.error(`[HostPeer] '${PeerMsgs.MouseDown.type}' error, ${e.message}`);
          return;
        }

        this.cursorMover.buttonDown(mouseDownMsg.x, mouseDownMsg.y, downButtonType);
        break;
      case PeerMsgs.MouseUp.type:
        const mouseUpMsg = PeerMsgs.MouseUp.unpack(message);

        let upButtonType: CursorMoverButtonType = null;
        try {
          upButtonType = toCursorMoverButtonType(mouseUpMsg.button);
        } catch (e) {
          logger.error(`[HostPeer] '${PeerMsgs.MouseUp.type}' error, ${e.message}`);
          return;
        }

        this.cursorMover.buttonUp(mouseUpMsg.x, mouseUpMsg.y, upButtonType);
        break;
      case PeerMsgs.DoubleClick.type:
        const dblClkMsg = PeerMsgs.DoubleClick.unpack(message);

        let dblClickButton: CursorMoverButtonType = null;
        try {
          dblClickButton = toCursorMoverButtonType(dblClkMsg.button);
        } catch (e) {
          logger.error(`[HostPeer] '${PeerMsgs.DoubleClick.type} error, ${e.message}`);
          return;
        }

        this.cursorMover.doubleClick(dblClkMsg.x, dblClkMsg.y, dblClickButton);
        break;
      case PeerMsgs.Scroll.type:
        const scrollMsg = PeerMsgs.Scroll.unpack(message);
        this.cursorMover.scroll(scrollMsg.deltaX, scrollMsg.deltaY);
        break;
      case PeerMsgs.KeyUp.type:
        const keyUp = PeerMsgs.KeyUp.unpack(message);
        this.keyPresser.pressUp(keyUp.code, keyUp.modifiers);
        break;
      case PeerMsgs.KeyDown.type:
        const keyDown = PeerMsgs.KeyDown.unpack(message);
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

