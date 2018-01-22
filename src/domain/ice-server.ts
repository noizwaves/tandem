export interface IceServer {
  urls: string;
  username: string;
  credential: string;
  location: string;
}

export interface LocatedIceServer extends IceServer {
  ip: string;
}

export interface IceServerLocator {
  readonly servers: IceServer[];
  readonly locatedServers: Promise<LocatedIceServer[]>;
}
