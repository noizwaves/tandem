import {HostConnectionSnapshot} from '../../domain/connection-statistics';
import {HostStatisticsMapper} from './host-statistics-mapper';
import {PeerStatisticsSource} from './peer-statistics-source';

export class HostPeerStatisticsSource extends PeerStatisticsSource<HostConnectionSnapshot> {
  constructor(peer) {
    super(peer, new HostStatisticsMapper());
  }
}
