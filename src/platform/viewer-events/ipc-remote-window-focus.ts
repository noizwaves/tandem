import * as DisplayChampionIPC from '../../displaychampion.ipc';
import {RemoteWindowFocus} from './remote-window-focus';

export class IpcRemoteWindowFocus implements RemoteWindowFocus {
  private focused: boolean = true;

  constructor(private ipc) {
    DisplayChampionIPC.Blur.on(ipc, () => this.focused = false);
    DisplayChampionIPC.Focus.on(ipc, () => this.focused = true);
  }

  isFocused(): boolean {
    return this.focused;
  }
}
