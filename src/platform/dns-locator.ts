import {IceServer, IceServerLocator, LocatedIceServer} from '../domain/ice-server';

const dns = require('dns');

export class DnsLocator implements IceServerLocator {
  readonly servers: IceServer[];
  readonly locatedServers: Promise<LocatedIceServer[]>;

  constructor(private _servers: IceServer[]) {
    this.servers = _servers;

    this.locatedServers = Promise.all(this._servers.map(async server => {
      return {
        ...server,
        ip: await DnsLocator.lookupFromUrls(server.urls),
      };
    }));
  }

  private static lookupFromUrls(urls: string): Promise<string> {
    const hostname = urls.split(':', 2)[1];

    return new Promise(((resolve, reject) => {
      dns.lookup(hostname, (error, address) => {
        if (error) {
          reject(error);
        } else {
          resolve(address);
        }
      });
    }));
  }
}
