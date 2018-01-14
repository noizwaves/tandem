import {KeyPressDetector} from '../domain/key-press-detector';
import {KeyDownEvent, KeyUpEvent} from '../domain/keyboard';
import {MouseButton, MouseButtonEvent} from '../domain/mouse';
import {MouseWheelDetector} from '../platform/mouse-wheel';
import {MousePositionDetector} from '../platform/mouse-position';

import * as Peer from 'simple-peer';
import * as PeerMsgs from '../peer-msgs';
import * as Rx from 'rxjs/Rx';
import {preferVP8WithBoostedBitrate} from '../sdp-codec-adjuster';

import {getLogger} from '../logging';
import {ElementMouseButtonDetector} from '../platform/element-mouse-button-detector';

const logger = getLogger();


export class JoinPeer {
  public readonly answer: Rx.Observable<any>;
  public readonly connected: Rx.Observable<boolean>;
  public readonly screenSize: Rx.Observable<{ height: number, width: number }>;

  private readonly p: Peer;

  private readonly positionDetector: MousePositionDetector;
  private readonly buttonDetector: ElementMouseButtonDetector;
  private readonly wheelDetector: MouseWheelDetector;
  private readonly keyPressDetector: KeyPressDetector;

  private readonly _screenSize: Rx.Subject<{ height: number, width: number }>;
  private readonly _connected: Rx.Subject<boolean>;

  private _positionSubscription: Rx.Subscription;
  private _downButtonSubscription: Rx.Subscription;
  private _upButtonSubscription: Rx.Subscription;
  private _doubleClickSubscription: Rx.Subscription;
  private _wheelChangeSubscription: Rx.Subscription;
  private _keyUpSubscription: Rx.Subscription;
  private _keyDownSubscription: Rx.Subscription;

  constructor(iceServers, remoteScreen: HTMLMediaElement, detectorFactory: DetectorFactory) {
    const answer = new Rx.Subject<any>();
    this.answer = answer;

    this._connected = new Rx.Subject<boolean>();
    this.connected = this._connected;

    this._screenSize = new Rx.Subject<{ height: number, width: number }>();
    this.screenSize = this._screenSize;

    this.positionDetector = new MousePositionDetector(remoteScreen);
    this.buttonDetector = new ElementMouseButtonDetector(remoteScreen);
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
      logger.info('[JoinPeer] CONNECT');

      this._connected.next(true);
    });

    p.on('close', () => {
      logger.info('[JoinPeer] CLOSE');

      this.dispose();
      this._connected.next(false);
    });

    p.on('error', function (err) {
      logger.warn(`[JoinPeer] ERROR: ${err}`);
    });

    p.on('data', (data) => {
      const unhandled = this.handleMessageFromHost(data);
      if (unhandled) {
        logger.warnSensitive('[JoinPeer] Unhandled data message', unhandled);
      }
    });

    p.on('stream', (stream) => {
      remoteScreen.srcObject = stream;
      remoteScreen.onloadedmetadata = () => {
        remoteScreen.play();

        this._positionSubscription = this.positionDetector.position.subscribe(mouseMove => {
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
            logger.error(`[JoinPeer] Error getting message button type: ${e.message}`);
            return;
          }

          sendButtonMessage(p, xDown, yDown, msgButton);
        };
        this._downButtonSubscription = this.buttonDetector.down.subscribe((e) => buttonMsgSender(e, PeerMsgs.sendMouseDown));
        this._upButtonSubscription = this.buttonDetector.up.subscribe((e) => buttonMsgSender(e, PeerMsgs.sendMouseUp));

        this._doubleClickSubscription = this.buttonDetector.double.subscribe(event => {
          const xDown = event.x / event.width;
          const yDown = event.y / event.height;

          let msgButton: PeerMsgs.MouseButton = null;
          try {
            msgButton = toMessageButtonType(event.button);
          } catch (e) {
            logger.error(`[JoinPeer] Error getting message button type: ${e.message}`);
            return;
          }

          PeerMsgs.sendDoubleClick(p, xDown, yDown, msgButton);
        });

        this._wheelChangeSubscription = this.wheelDetector.wheelChange.subscribe((wheelDelta) => {
          PeerMsgs.sendScroll(p, -1 * wheelDelta.deltaX, -1 * wheelDelta.deltaY);
        });

        this._keyUpSubscription = this.keyPressDetector.keyUp.subscribe((e: KeyUpEvent) => {
          PeerMsgs.sendKeyUp(p, e.key, e.modifiers);
        });
        this._keyDownSubscription = this.keyPressDetector.keyDown.subscribe((e: KeyDownEvent) => {
          PeerMsgs.sendKeyDown(p, e.key, e.modifiers);
        });
      };
    });
  }

  public acceptOffer(offer) {
    this.p.signal(offer);
  }

  public disconnect(): void {
    this.dispose();
    this.p.destroy();
  }

  private handleMessageFromHost(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (err) {
      logger.errorSensitive('[JoinPeer] JSON parse failed', err);
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

  private dispose(): void {
    if (this._positionSubscription) {
      this._positionSubscription.unsubscribe();
    }
    if (this._downButtonSubscription) {
      this._downButtonSubscription.unsubscribe();
    }
    if (this._upButtonSubscription) {
      this._upButtonSubscription.unsubscribe();
    }
    if (this._doubleClickSubscription) {
      this._doubleClickSubscription.unsubscribe();
    }
    if (this._wheelChangeSubscription) {
      this._wheelChangeSubscription.unsubscribe();
    }
    if (this._keyUpSubscription) {
      this._keyUpSubscription.unsubscribe();
    }
    if (this._keyDownSubscription) {
      this._keyDownSubscription.unsubscribe();
    }

    this.buttonDetector.dispose();
    this.positionDetector.dispose();
    this.wheelDetector.dispose();
    this.keyPressDetector.dispose();
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
