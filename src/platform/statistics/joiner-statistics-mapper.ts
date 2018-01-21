import {
  ConnectionMethod as Method,
  ConnectionProtocol as Protocol,
  JoinerConnectionSnapshot
} from '../../domain/connection-statistics';
import {StatisticsMapper} from './peer-statistics-source';

export class JoinerStatisticsMapper implements StatisticsMapper<JoinerConnectionSnapshot> {
  parseWebRtcStats(webRtcStats): JoinerConnectionSnapshot {
    const transport = webRtcStats
      .filter(r => r.type === 'transport')[0];

    const candidatePair = webRtcStats
      .filter(r => r.type === 'candidate-pair')
      .filter(r => transport && r.id === transport.selectedCandidatePairId)[0];

    const inboundRtp = webRtcStats
      .filter(r => r.type === 'inbound-rtp')[0];

    const remoteCandidate = webRtcStats
      .filter(r => r.type === 'remote-candidate')
      .filter(r => candidatePair && r.id === candidatePair.remoteCandidateId)[0];

    const roundTripTimeMs = (candidatePair && candidatePair.currentRoundTripTime)
      ? candidatePair.currentRoundTripTime * 1000
      : null;

    const bytesReceived = inboundRtp ? inboundRtp.bytesReceived : null;
    const packetsLost = inboundRtp ? inboundRtp.packetsLost : null;

    const connection = (remoteCandidate)
      ? {
        protocol: remoteCandidate.protocol === 'udp' ? Protocol.UDP : Protocol.TCP,
        ip: remoteCandidate.ip,
        port: remoteCandidate.port,
        method: remoteCandidate.candidateType === 'relay' ? Method.Relay : Method.Direct,
      }
      : {
        protocol: null,
        ip: null,
        port: null,
        method: null,
      };

    return {
      roundTripTimeMs,
      bytesReceived,
      packetsLost,
      connection,
    };
  }
}
