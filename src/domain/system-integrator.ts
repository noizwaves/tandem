import * as Rx from 'rxjs/Rx';

export interface SystemIntegrator {
  isTrusted(): boolean;

  readonly trust: Rx.Observable<boolean>;
}
