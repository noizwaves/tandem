import {
  Connection,
  ConnectionMethod as Method,
  ConnectionProtocol as Protocol,
  HostConnectionSnapshot
} from '../../domain/connection-statistics';
import {StatisticsMapper} from './peer-statistics-source';
import {LocatedIceServer} from '../../domain/ice-server';

export class HostStatisticsMapper implements StatisticsMapper<HostConnectionSnapshot> {
  parseWebRtcStats(webRtcStats, iceServers: LocatedIceServer[]) {
    const transport = webRtcStats
      .filter(r => r.type === 'transport')[0];

    const candidatePair = webRtcStats
      .filter(r => r.type === 'candidate-pair')
      .filter(r => transport && r.id === transport.selectedCandidatePairId)[0];

    const outboundRtp = webRtcStats
      .filter(r => r.type === 'outbound-rtp')[0];

    const localCandidate = webRtcStats
      .filter(r => r.type === 'local-candidate')
      .filter(r => candidatePair && r.id === candidatePair.localCandidateId)[0];

    const roundTripTimeMs = (candidatePair && candidatePair.currentRoundTripTime)
      ? candidatePair.currentRoundTripTime * 1000
      : null;

    const bytesSent = outboundRtp ? outboundRtp.bytesSent : null;

    const relayServer = (iceServers && localCandidate && localCandidate.candidateType === 'relay')
      ? iceServers
        .filter(s => s.ip === localCandidate.ip)[0]
      : null;

    const connection: Connection = (localCandidate)
      ? {
        protocol: localCandidate.protocol === 'udp' ? Protocol.UDP : Protocol.TCP,
        ip: localCandidate.ip,
        port: localCandidate.port,
        method: localCandidate.candidateType === 'relay' ? Method.Relay : Method.Direct,
        relayLocation: relayServer === null ? null : relayServer.location,
      }
      : {
        protocol: null,
        ip: null,
        port: null,
        method: null,
        relayLocation: null,
      };

    return {
      roundTripTimeMs,
      bytesSent,
      connection,
    };
  }
}
