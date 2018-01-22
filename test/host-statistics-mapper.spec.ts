import {expect, use as chaiUse} from 'chai';
import 'mocha';

import {HostStatisticsMapper} from '../src/platform/statistics/host-statistics-mapper';
import {ConnectionMethod, ConnectionProtocol} from '../src/domain/connection-statistics';

chaiUse(require('sinon-chai'));


describe('HostStatisticsMapper', () => {
  describe('parseWebRtcStats', () => {
    describe('no transport', () => {
      const result = new HostStatisticsMapper().parseWebRtcStats([
        {type: 'candidate-pair', id: 'foo'},
        {type: 'remote-candidate', id:' bar',}
      ], null);

      it('nulls out the roundTripTimeMs', () => {
        expect(result.roundTripTimeMs).to.be.null;
      });

      it('nulls out each value in connection', () => {
        expect(result.connection).to.deep.equal({
          ip: null,
          protocol: null,
          port: null,
          method: null,
          relayLocation: null,
        });
      });
    });

    describe('no selected candidate pair', () => {
      const noSelectedCandidatePair = [
        {type: 'transport', selectedCandidatePairId: null},
        {type: 'candidate-pair', id: 'foo'},
        {type: 'remote-candidate', id:' bar',}
      ];

      it('nulls out the roundTripTimeMs', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats(noSelectedCandidatePair, null);

        expect(result.roundTripTimeMs).to.be.null;
      });

      it('nulls out each value in connection', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats(noSelectedCandidatePair, null);

        expect(result.connection).to.deep.equal({
          ip: null,
          protocol: null,
          port: null,
          method: null,
          relayLocation: null,
        });
      });
    });

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
        const result = new HostStatisticsMapper().parseWebRtcStats(multiplePairsStats, null);

        expect(result.roundTripTimeMs).to.equal(123);
      });

      it('gets the correct connection', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats(multiplePairsStats, null);

        expect(result.connection).to.deep.equal({
          ip: '3.3.3.3',
          protocol: ConnectionProtocol.UDP,
          port: 333,
          method: ConnectionMethod.Relay,
          relayLocation: null,
        });
      });
    });

    describe('ice servers have been located', () => {
      const relayedStats = [
        {type: 'transport', selectedCandidatePairId: 'selected'},
        {type: 'candidate-pair', id: 'selected', remoteCandidateId: '3', currentRoundTripTime: 0.123},
        {type: 'remote-candidate', id: '3', protocol: 'udp', ip: '3.3.3.3', port: 333, candidateType: 'relay'},
      ];
      const directStats = [
        {type: 'transport', selectedCandidatePairId: 'selected'},
        {type: 'candidate-pair', id: 'selected', remoteCandidateId: '3', currentRoundTripTime: 0.123},
        {type: 'remote-candidate', id: '3', protocol: 'udp', ip: '3.3.3.3', port: 333, candidateType: 'direct'},
      ];

      it('uses the location when current candidate is relayed', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats(relayedStats, [
          {ip: '2.2.2.2', urls: 'example2.com', username: 'foo', credential: 'bar', location: 'baz'},
          {ip: '3.3.3.3', urls: 'example3.com', username: 'foo', credential: 'bar', location: 'bingo'},
          {ip: '4.4.4.4', urls: 'example4.com', username: 'foo', credential: 'bar', location: 'buhbow'},
        ]);

        expect(result.connection.relayLocation).to.equal('bingo');
      });

      it('is null when current candidate is direct', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats(directStats, [
          {ip: '2.2.2.2', urls: 'example2.com', username: 'foo', credential: 'bar', location: 'baz'},
          {ip: '3.3.3.3', urls: 'example3.com', username: 'foo', credential: 'bar', location: 'bingo'},
          {ip: '4.4.4.4', urls: 'example4.com', username: 'foo', credential: 'bar', location: 'buhbow'},
        ]);

        expect(result.connection.relayLocation).to.be.null;
      })
    });

    describe('handles missing fields', () => {
      it('currentRoundTripTime field', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', state: 'succeeded', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2'},
        ], null);

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
        ], null);

        it('gets bytesSent', () => {
          expect(result.bytesSent).to.equal(22);
        });
      });

      describe('when absent', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2'},
        ], null);

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
        ], null);

        expect(result.connection.protocol).to.deep.equal(ConnectionProtocol.UDP);
      });
    });

    describe('different candidateType values', () => {
      it('parses "relay" candidateType correctly', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', state: 'succeeded', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2', port: 444, candidateType: 'relay'},
        ], null);

        expect(result.connection.method).to.deep.equal(ConnectionMethod.Relay);
      });

      it('parses "srflx" candidateType correctly', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', state: 'succeeded', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2', port: 444, candidateType: 'srflx'},
        ], null);

        expect(result.connection.method).to.deep.equal(ConnectionMethod.Direct);
      });

      it('parses "prflx" candidateType correctly', () => {
        const result = new HostStatisticsMapper().parseWebRtcStats([
          {type: 'transport', selectedCandidatePairId: 'selected'},
          {type: 'candidate-pair', id: 'selected', state: 'succeeded', remoteCandidateId: '2'},
          {type: 'remote-candidate', id: '2', protocol: 'udp', ip: '2.2.2.2', port: 444, candidateType: 'prflx'},
        ], null);

        expect(result.connection.method).to.deep.equal(ConnectionMethod.Direct);
      });
    });
  });
});
