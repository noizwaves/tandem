import {expect, use as chaiUse} from 'chai';
import 'mocha';
import * as sinon from 'sinon';

const mock = require('mock-require');

chaiUse(require('sinon-chai'));


describe('DnsLocator', () => {
  describe('looking up IP addresses', () => {
    let DnsLocator = null;
    let lookupMock = null;

    beforeEach(() => {
      lookupMock = sinon.stub();
      mock('dns', {
        lookup: lookupMock
      });

      DnsLocator = mock.reRequire('../src/platform/dns-locator').DnsLocator;
    });

    afterEach(() => {
      mock.stop('dns');
    });

    it('looks up IP using the hostname', async () => {
      lookupMock.callsFake((host, cb) => cb(null, '1.2.3.4'));

      const locator = new DnsLocator([{
        urls: 'turn:example.com:22?param=value',
        username: 'foo',
        credential: 'bar',
        location: 'baz'
      }]);

      const result = await locator.locatedServers;

      expect(result[0].ip).to.equal('1.2.3.4');

      expect(lookupMock).to.have.been.calledWith('example.com');
    });
  });
});
