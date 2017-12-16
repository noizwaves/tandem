import {expect, use as chaiUse} from 'chai';
import 'mocha';
import * as sinon from 'sinon';
chaiUse(require('sinon-chai'));

import {AxiosInstance} from 'axios';

import {UpdateChecker} from '../src/update-checker';

describe('UpdateChecker', () => {
  it('understands when an update is available', async () => {
    const getStub = sinon.stub()
      .returns(Promise.resolve({
        status: 200,
      }));

    const axiosMock = <AxiosInstance> (<any> {
      get: getStub
    });

    const checker = new UpdateChecker(axiosMock, 'myver');

    const result: boolean = await checker.isUpdateAvailable();

    expect(result).to.equal(true);
    expect(getStub).to.have.been.calledWith('https://tandem-nuts.cfapps.io/update/macos/myver');
  });

  it('understands when no update is available', async () => {
    const axiosMock = <AxiosInstance> (<any> {
      get: () => {
        return Promise.resolve({
          status: 204,
        });
      }
    });

    const checker = new UpdateChecker(axiosMock, 'myver');

    const result: boolean = await checker.isUpdateAvailable();

    expect(result).to.equal(false);
  });

  it('converts errors into no updates available', async () => {
    const axiosMock = <AxiosInstance> (<any> {
      get: () => {
        return Promise.reject(new Error('Host error'));
      }
    });

    const checker = new UpdateChecker(axiosMock, 'myver');

    const result: boolean = await checker.isUpdateAvailable();

    expect(result).to.equal(false);
  });
});
