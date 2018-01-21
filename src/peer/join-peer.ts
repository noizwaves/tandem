import {KeyPressDetector} from '../domain/key-press-detector';
import {KeyDownEvent, KeyUpEvent} from '../domain/keyboard';
import {MouseButtonDetector} from '../domain/mouse';
import {MousePositionDetector} from '../domain/mouse-position-detector';
import {MouseWheelDetector} from '../domain/mouse-wheel-detector';
import {DetectorFactory} from '../domain/detector-factory';

import {JoinerPeerStatisticsSource} from '../platform/statistics/joiner-peer-statistics-source';
import {ConnectionSnapshot, JoinerStatisticsSource} from '../domain/connection-statistics';

import * as Peer from 'simple-peer';
import * as PeerMsgs from '../peer-msgs';
import * as Rx from 'rxjs/Rx';
import {preferVP8WithBoostedBitrate} from '../sdp-codec-adjuster';

import {getLogger} from '../logging';

const logger = getLogger();


export class JoinPeer {
  public readonly answer: Rx.Observable<any>;
  public readonly connected: Rx.Observable<boolean>;
  public readonly screenSize: Rx.Observable<{ height: number, width: number }>;
  public readonly stats: Rx.Observable<ConnectionSnapshot>;

  private readonly p: Peer;

  private readonly positionDetector: MousePositionDetector;
  private readonly buttonDetector: MouseButtonDetector;
  private readonly wheelDetector: MouseWheelDetector;
  private readonly keyPressDetector: KeyPressDetector;

  private readonly _screenSize: Rx.Subject<{ height: number, width: number }>;
  private readonly _connected: Rx.Subject<boolean>;
  private readonly _stats: Rx.Subject<ConnectionSnapshot>;

  private _positionSubscription: Rx.Subscription;
  private _downButtonSubscription: Rx.Subscription;
  private _upButtonSubscription: Rx.Subscription;
  private _doubleClickSubscription: Rx.Subscription;
  private _wheelChangeSubscription: Rx.Subscription;
  private _keyUpSubscription: Rx.Subscription;
  private _keyDownSubscription: Rx.Subscription;
  private _statsSubscription: Rx.Subscription;

  constructor(iceServers, remoteScreen: HTMLMediaElement, detectorFactory: DetectorFactory) {
    const answer = new Rx.Subject<any>();
    this.answer = answer;

    this._connected = new Rx.Subject<boolean>();
    this.connected = this._connected;

    this._screenSize = new Rx.Subject<{ height: number, width: number }>();
    this.screenSize = this._screenSize;

    this.positionDetector = detectorFactory.getMousePositionDetector();
    this.buttonDetector = detectorFactory.getMouseButtonDetector();
    this.wheelDetector = detectorFactory.getMouseWheelDetector();
    this.keyPressDetector = detectorFactory.getKeyPressDetector();

    const p = new Peer({
      config: {
        iceServers: iceServers
      },
      sdpTransform: preferVP8WithBoostedBitrate,
      initiator: false,
      trickle: false
    });

    const source: JoinerStatisticsSource = new JoinerPeerStatisticsSource(p);

    this.p = p;

    p.on('signal', (data) => {
      const sdp = data.sdp;
      // const sdp = forceRelay(data.sdp);
      answer.next({sdp, type: data.type});
    });

    p.on('connect', () => {
      logger.info('[JoinPeer] CONNECT');

      this._statsSubscription = source.statistics
        .do(stats => {
          logger.debug(`[JoinPeer] stats: ${JSON.stringify(stats)}`);
          this._stats.next(stats);
        })
        .subscribe();

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

          PeerMsgs.MouseMove.send(p, {x: xMove, y: yMove});
        });

        this._downButtonSubscription = this.buttonDetector.down.subscribe(event => {
          const xDown = event.x / event.width;
          const yDown = event.y / event.height;

          PeerMsgs.MouseDown.send(p, {x: xDown, y: yDown, button: event.button});
        });
        this._upButtonSubscription = this.buttonDetector.up.subscribe(event => {
          const xDown = event.x / event.width;
          const yDown = event.y / event.height;

          PeerMsgs.MouseUp.send(p, {x: xDown, y: yDown, button: event.button});
        });

        this._doubleClickSubscription = this.buttonDetector.double.subscribe(event => {
          const xDown = event.x / event.width;
          const yDown = event.y / event.height;

          PeerMsgs.DoubleClick.send(p, {x: xDown, y: yDown, button: event.button});
        });

        this._wheelChangeSubscription = this.wheelDetector.wheelChange.subscribe((wheelDelta) => {
          PeerMsgs.Scroll.send(p, {deltaX: -1 * wheelDelta.deltaX, deltaY: -1 * wheelDelta.deltaY});
        });

        this._keyUpSubscription = this.keyPressDetector.keyUp.subscribe((e: KeyUpEvent) => {
          PeerMsgs.KeyUp.send(p, {code: e.key, modifiers: e.modifiers});
        });
        this._keyDownSubscription = this.keyPressDetector.keyDown.subscribe((e: KeyDownEvent) => {
          PeerMsgs.KeyDown.send(p, {code: e.key, modifiers: e.modifiers});
        });
      };
    });

    this._stats = new Rx.Subject<ConnectionSnapshot>();
    this.stats = this._stats.asObservable();
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
      case PeerMsgs.ScreenSize.type:
        const {height, width} = PeerMsgs.ScreenSize.unpack(message);
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
    if (this._statsSubscription) {
      this._statsSubscription.unsubscribe();
    }

    this.buttonDetector.dispose();
    this.positionDetector.dispose();
    this.wheelDetector.dispose();
    this.keyPressDetector.dispose();
    this._stats.complete();
  }
}
