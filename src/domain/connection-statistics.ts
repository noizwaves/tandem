import * as Rx from 'rxjs';

export interface JoinerConnectionSnapshot {
  readonly roundTripTimeMs: number;
  readonly connection: Connection;
  readonly packetsLost: number;
  readonly bytesReceived: number;
}

export interface StatisticsSource<T> {
  readonly statistics: Rx.Observable<T>;
}

export interface JoinerStatisticsSource extends StatisticsSource<JoinerConnectionSnapshot> {
}

export interface HostConnectionSnapshot {
  readonly roundTripTimeMs: number;
  readonly connection: Connection;
  readonly bytesSent: number;
}

export interface HostStatisticsSource extends StatisticsSource<HostConnectionSnapshot> {
}

export interface Connection {
  readonly ip: string;
  readonly protocol: ConnectionProtocol;
  readonly port: number;
  readonly method: ConnectionMethod;
}

export enum ConnectionMethod {
  Direct = 'direct',
  Relay = 'relay',
}

export enum ConnectionProtocol {
  UDP = 'udp',
  TCP = 'tcp',
}
