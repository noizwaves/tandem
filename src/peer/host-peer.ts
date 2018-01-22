import {CursorMover} from '../domain/cursor-mover';
import {KeyPresser} from '../domain/key-presser';
import {ActuatorFactory} from '../domain/actuator-factory';
import {IceServerLocator} from '../domain/ice-server';
import {ConnectionSnapshot, HostStatisticsSource} from '../domain/connection-statistics';

import {HostPeerStatisticsSource} from '../platform/statistics/host-peer-statistics-source';

import * as Peer from 'simple-peer';
import * as PeerMsgs from '../peer-msgs';
import * as Rx from 'rxjs/Rx';
import {preferVP8WithBoostedBitrate} from '../sdp-codec-adjuster';

import {getLogger} from '../logging';

const logger = getLogger();


export class HostPeer {
  public readonly offer: Rx.Observable<any>;
  public readonly connected: Rx.Observable<boolean>;
  public readonly stats: Rx.Observable<ConnectionSnapshot>;

  private readonly keyPresser: KeyPresser;
  private readonly cursorMover: CursorMover;

  private readonly p: Peer;

  private readonly _stats: Rx.Subject<ConnectionSnapshot>;
  private _statsSubscription: Rx.Subscription;

  constructor(iceServers: IceServerLocator, screenStream, actuatorFactory: ActuatorFactory) {
    const offer = new Rx.Subject<any>();
    this.offer = offer;

    const connected = new Rx.Subject<boolean>();
    this.connected = connected;

    this.keyPresser = actuatorFactory.getKeyPresser();
    this.cursorMover = actuatorFactory.getCursorMover();

    const p = new Peer({
      config: {
        iceServers: iceServers.servers
      },
      sdpTransform: preferVP8WithBoostedBitrate,
      initiator: true,
      trickle: false,
      stream: screenStream
    });

    const source: HostStatisticsSource = new HostPeerStatisticsSource(p, iceServers);

    p.on('signal', (data) => {
      const sdp = data.sdp;
      // const sdp = forceRelay(data.sdp);
      offer.next({sdp, type: data.type});
    });

    p.on('connect', () => {
      logger.info('[HostPeer] CONNECT');

      PeerMsgs.ScreenSize.send(p, {height: screen.height, width: screen.width});

      this._statsSubscription = source.statistics
        .do((stats) => {
          logger.debug(`[HostPeer] stats: ${JSON.stringify(stats)}`);
          this._stats.next(stats);
        })
        .subscribe();

      connected.next(true);
    });

    p.on('close', () => {
      logger.info('[HostPeer] CLOSE');

      screenStream.getTracks().forEach(t => t.stop());
      this.dispose();

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

    this._stats = new Rx.Subject<ConnectionSnapshot>();
    this.stats = this._stats.asObservable();

    this.p = p;
  }

  public acceptAnswer(answer): void {
    this.p.signal(answer);
  }

  private dispose() {
    if (this._statsSubscription) {
      this._statsSubscription.unsubscribe();
    }
    this._stats.complete();
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
        this.cursorMover.buttonDown(mouseDownMsg.x, mouseDownMsg.y, mouseDownMsg.button);
        break;
      case PeerMsgs.MouseUp.type:
        const mouseUpMsg = PeerMsgs.MouseUp.unpack(message);
        this.cursorMover.buttonUp(mouseUpMsg.x, mouseUpMsg.y, mouseUpMsg.button);
        break;
      case PeerMsgs.DoubleClick.type:
        const dblClkMsg = PeerMsgs.DoubleClick.unpack(message);
        this.cursorMover.doubleClick(dblClkMsg.x, dblClkMsg.y, dblClkMsg.button);
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
