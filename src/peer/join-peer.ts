import {KeyPressDetector} from '../key-press-detector';
import {KeyDownEvent, KeyUpEvent} from '../keyboard';
import {MouseButton, MouseButtonDetector, MouseButtonEvent} from '../mouse-button';
import {MouseWheelDetector} from '../mouse-wheel';
import {MousePositionDetector} from '../mouse-position';

import * as Peer from 'simple-peer';
import * as PeerMsgs from '../peer-msgs';
import * as Rx from 'rxjs/Rx';
import {preferVP8WithBoostedBitrate} from '../sdp-codec-adjuster';

import {getLogger} from '../logging';

const logger = getLogger();


export class JoinPeer {
  public readonly answer: Rx.Observable<any>;
  public readonly connected: Rx.Observable<boolean>;
  public readonly screenSize: Rx.Observable<{height: number, width: number}>;

  private readonly p: Peer;

  private readonly positionDetector: MousePositionDetector;
  private readonly buttonDetector: MouseButtonDetector;
  private readonly wheelDetector: MouseWheelDetector;
  private readonly keyPressDetector: KeyPressDetector;

  private readonly _screenSize: Rx.Subject<{height: number, width: number}>;

  constructor(iceServers, remoteScreen: HTMLMediaElement, detectorFactory: DetectorFactory) {
    const answer = new Rx.Subject<any>();
    this.answer = answer;

    const connected = new Rx.Subject<boolean>();
    this.connected = connected;

    this._screenSize = new Rx.Subject<{height: number, width: number}>();
    this.screenSize = this._screenSize;

    this.positionDetector = new MousePositionDetector(remoteScreen);
    this.buttonDetector = new MouseButtonDetector(remoteScreen);
    this.wheelDetector = new MouseWheelDetector(remoteScreen);
    this.keyPressDetector = detectorFactory.getKeyPressDetector();

    const p = new Peer({
      config: {
        iceServers: iceServers
      },
      sdpTransform: preferVP8WithBoostedBitrate,
      initiator: false,
      trickle: false
    });

    this.p = p;

    p.on('signal', (data) => {
      answer.next(data);
    });

    p.on('connect', () => {
      logger.info('[peer] CONNECT');

      connected.next(true);
    });

    p.on('close', () => {
      logger.info('[peer] CLOSE');

      connected.next(false);
    });

    p.on('error', function (err) {
      logger.warn(`[peer] ERROR: ${err}`);
    });

    p.on('data', (data) => {
      const unhandled = this.handleMessageFromHost(data);
      if (unhandled) {
        logger.warnSensitive('[DisplayChampion] Unhandled data message', unhandled);
      }
    });

    p.on('stream', (stream) => {
      remoteScreen.srcObject = stream;
      remoteScreen.onloadedmetadata = () => {
        remoteScreen.play();

        // TODO: capture these subscriptions and dispose of them somehwere?
        // or just handle this when we dispose the detectors?!
        this.positionDetector.position.subscribe(mouseMove => {
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
        this.buttonDetector.down.subscribe((e) => buttonMsgSender(e, PeerMsgs.sendMouseDown));
        this.buttonDetector.up.subscribe((e) => buttonMsgSender(e, PeerMsgs.sendMouseUp));

        this.wheelDetector.wheelChange.subscribe((wheelDelta) => {
          PeerMsgs.sendScroll(p, -1 * wheelDelta.deltaX, -1 * wheelDelta.deltaY);
        });

        this.keyPressDetector.keyUp.subscribe((e: KeyUpEvent) => {
          PeerMsgs.sendKeyUp(p, e.key, e.modifiers);
        });
        this.keyPressDetector.keyDown.subscribe((e: KeyDownEvent) => {
          PeerMsgs.sendKeyDown(p, e.key, e.modifiers);
        });
      }
    });
  }

  public acceptOffer(offer) {
    this.p.signal(offer);
  }

  private handleMessageFromHost(data) {
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
        this._screenSize.next({height, width});
        break;
      default:
        result = data;
    }

    return result;
  }
}

export interface DetectorFactory {
  getKeyPressDetector(): KeyPressDetector;
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
