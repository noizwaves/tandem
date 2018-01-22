import {StatisticsSource} from '../../domain/connection-statistics';
import * as Rx from 'rxjs/Rx';
import {IceServerLocator, LocatedIceServer} from '../../domain/ice-server';

export interface StatisticsMapper<T> {
  parseWebRtcStats(webRtcStats, iceServers: LocatedIceServer[]): T;
}

export abstract class PeerStatisticsSource<T> implements StatisticsSource<T> {
  readonly statistics: Rx.Observable<T>;

  constructor(peer, mapper: StatisticsMapper<T>, iceServers: IceServerLocator) {
    let locatedServers = null;
    iceServers.locatedServers.then(result => {
      locatedServers = result;
    });

    this.statistics = Rx.Observable
      .interval(1000)
      .flatMap(() => new Promise((resolve, reject) => {
        peer.getStats((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }))
      .map(res => mapper.parseWebRtcStats(res, locatedServers));
  }
}
