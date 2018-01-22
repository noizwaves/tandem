import {HostConnectionSnapshot} from '../../domain/connection-statistics';
import {HostStatisticsMapper} from './host-statistics-mapper';
import {PeerStatisticsSource} from './peer-statistics-source';
import {IceServerLocator} from '../../domain/ice-server';

export class HostPeerStatisticsSource extends PeerStatisticsSource<HostConnectionSnapshot> {
  constructor(peer, iceServers: IceServerLocator) {
    super(peer, new HostStatisticsMapper(), iceServers);
  }
}
