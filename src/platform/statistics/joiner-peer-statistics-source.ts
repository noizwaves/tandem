import {JoinerConnectionSnapshot} from '../../domain/connection-statistics';
import {JoinerStatisticsMapper} from './joiner-statistics-mapper';
import {PeerStatisticsSource} from './peer-statistics-source';

export class JoinerPeerStatisticsSource extends PeerStatisticsSource<JoinerConnectionSnapshot> {
  constructor(peer) {
    super(peer, new JoinerStatisticsMapper());
  }
}
