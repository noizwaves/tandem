import {expect, use as chaiUse} from 'chai';
import 'mocha';

import {HostStatisticsMapper} from '../src/platform/statistics/host-statistics-mapper';
import {ConnectionMethod, ConnectionProtocol} from '../src/domain/connection-statistics';

chaiUse(require('sinon-chai'));


describe('HostStatisticsMapper', () => {
  describe('parseWebRtcStats', () => {

    describe('multiple candidate-pair stats', () => {
      const multiplePairsStats = [
        {type: 'transport', selectedCandidatePairId: 'selected'},
        {type: 'candidate-pair', id: 'not', remoteCandidateId: '1', currentRoundTripTime: 0.1},
        {type: 'remote-candidate', id: '1', protocol: 'udp', ip: '1.1.1.1', port: 111, candidateType: 'host'},
        {type: 'candidate-pair', id: 'selected', remoteCandidateId: '3', currentRoundTripTime: 0.123},
        {type: 'remote-candidate', id: '2', protocol: 'tcp', ip: '2.2.2.2', port: 222, candidateType: 'relay'},
        {type: 'remote-candidate', id: '3', protocol: 'udp', ip: '3.3.3.3', port: 333, candidateType: 'relay'},
        {type: 'remote-candidate', id: '4', protocol: 'udp', ip: '4.4.4.4', port: 444, candidateType: 'host'},
        {type: 'candidate-pair', id: 'negative', remoteCandidateId: '5', currentRoundTripTime: 0.2},
        {type: 'remote-candidate', id: '5', protocol: 'udp', ip: '5.5.5.5', port: 555, candidateType: 'host'},
      ];

      it('gets the correct value for roundTripTimeMs', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats(multiplePairsStats);

        expect(result.roundTripTimeMs).to.equal(123);
      });

      it('gets the correct connection', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats(multiplePairsStats);

        expect(result.connection).to.deep.equal({
          ip: '3.3.3.3',
          protocol: ConnectionProtocol.UDP,
          port: 333,
          method: ConnectionMethod.Relay,
        });
      })
    });

    describe('handles missing fields', () => {
      it('currentRoundTripTime field', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', state: 'succeeded', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2'},
        ]);

        expect(result.roundTripTimeMs).to.be.null;
      });
    });

    describe('outbound-rtp stat', () => {
      describe('when present', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2'},
          {type: 'outbound-rtp', bytesSent: 22},
          {}
        ]);

        it('gets bytesSent', () => {
          expect(result.bytesSent).to.equal(22);
        });
      });

      describe('when absent', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2'},
        ]);

        it('nulls out bytesSent', () => {
          expect(result.bytesSent).to.be.null;
        });
      });
    });

    describe('different protocol values', () => {
      it('parses "udp" correctly', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', state: 'succeeded', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2', port: 444, candidateType: 'host'},
        ]);

        expect(result.connection.protocol).to.deep.equal(ConnectionProtocol.UDP);
      });
    });

    describe('different candidateType values', () => {
      it('parses "relay" candidateType correctly', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', state: 'succeeded', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2', port: 444, candidateType: 'relay'},
        ]);

        expect(result.connection.method).to.deep.equal(ConnectionMethod.Relay);
      });

      it('parses "srflx" candidateType correctly', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', state: 'succeeded', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2', port: 444, candidateType: 'srflx'},
        ]);

        expect(result.connection.method).to.deep.equal(ConnectionMethod.Direct);
      });

      it('parses "prflx" candidateType correctly', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', state: 'succeeded', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2', port: 444, candidateType: 'prflx'},
        ]);

        expect(result.connection.method).to.deep.equal(ConnectionMethod.Direct);
      });
    });
  });
});
