import {
  ConnectionMethod as Method,
  ConnectionProtocol as Protocol,
  HostConnectionSnapshot
} from '../../domain/connection-statistics';
import {StatisticsMapper} from './peer-statistics-source';

export class HostStatisticsMapper implements StatisticsMapper<HostConnectionSnapshot> {
  parseWebRtcStats(webRtcStats) {
    const transport = webRtcStats
      .filter(r => r.type === 'transport')[0];

    const candidatePair = webRtcStats
      .filter(r => r.type === 'candidate-pair')
      .filter(r => r.id === transport.selectedCandidatePairId)[0];

    const outboundRtp = webRtcStats
      .filter(r => r.type === 'outbound-rtp')[0];

    const remoteCandidate = webRtcStats
      .filter(r => r.type === 'remote-candidate')
      .filter(r => r.id === candidatePair.remoteCandidateId)[0];

    const roundTripTimeMs = (candidatePair && candidatePair.currentRoundTripTime)
      ? candidatePair.currentRoundTripTime * 1000
      : null;

    const bytesSent = outboundRtp ? outboundRtp.bytesSent : null;

    const connection = {
      protocol: remoteCandidate.protocol === 'udp' ? Protocol.UDP : Protocol.TCP,
      ip: remoteCandidate.ip,
      port: remoteCandidate.port,
      method: remoteCandidate.candidateType === 'relay' ? Method.Relay : Method.Direct,
    };

    return {
      roundTripTimeMs,
      bytesSent,
      connection,
    };
  }
}
