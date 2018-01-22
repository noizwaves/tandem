import {JoinerConnectionSnapshot} from '../../domain/connection-statistics';
import {JoinerStatisticsMapper} from './joiner-statistics-mapper';
import {PeerStatisticsSource} from './peer-statistics-source';
import {IceServerLocator} from '../../domain/ice-server';

export class JoinerPeerStatisticsSource extends PeerStatisticsSource<JoinerConnectionSnapshot> {
  constructor(peer, iceServers: IceServerLocator) {
    super(peer, new JoinerStatisticsMapper(), iceServers);
  }
}
