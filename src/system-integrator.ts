import * as Rx from 'rxjs';

export interface SystemIntegrator {
  isTrusted(): boolean;
  readonly trust: Rx.Observable<boolean>;
}

export class NoopSystemIntegrator implements SystemIntegrator {
  readonly trust: Rx.Observable<boolean>;

  constructor() {
    this.trust = Rx.Observable.of(true);
  }

  isTrusted(): boolean {
    return true;
  }
}


