import * as Rx from 'rxjs/Rx';
import {SystemIntegrator} from '../domain/system-integrator';

export class SystemIntegratorFactory {
  getSystemIntegrator(): SystemIntegrator {
    if (process.platform === 'darwin') {
      const { MacOsSystemIntegrator } = require('./macos');
      return new MacOsSystemIntegrator();
    }

    return new NoopSystemIntegrator();
  }
}

class NoopSystemIntegrator implements SystemIntegrator {
  readonly trust: Rx.Observable<boolean>;

  constructor() {
    this.trust = Rx.Observable.of(true);
  }

  isTrusted(): boolean {
    return true;
  }
}
