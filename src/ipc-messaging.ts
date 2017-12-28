import {BrowserWindow} from 'electron';

export interface Sender {
  send(name: string, data?: any): void;
}

export interface Recipient {
  on(name: string, callback: (event, data) => void): void;
  removeListener(name: string, callback: (event, data) => void): void;
}

export class TypedMessageChannel<T> {
  private name: string;
  private deferredDisposals: (() => void)[];

  constructor(name: string) {
    this.name = name;
    this.deferredDisposals = [];
  }

  send(target: BrowserWindow | Sender, message: T): void {
    // check for `webContents` to determine argument type, as instanceof fails
    if ((<any>target).webContents !== undefined) {
      (<BrowserWindow> target).webContents.send(this.name, message);
    } else {
      (<Sender> target).send(this.name, message);
    }
  }

  on(target: Recipient, callback: (message: T) => void): void {
    const handler = (event, data) => callback(<T> data);
    target.on(this.name, handler);

    this.deferredDisposals.push(() => {
      target.removeListener(this.name, handler);
    });
  }

  dispose(): void {
    this.deferredDisposals.forEach(func => func());
  }
}

export class MessageChannel {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  send(target: BrowserWindow | Sender): void {
    // check for `webContents` to determine argument type, as instanceof fails
    if ((<any>target).webContents !== undefined) {
      (<BrowserWindow> target).webContents.send(this.name);
    } else {
      (<Sender> target).send(this.name);
    }
  }

  on(target: Recipient, callback: () => void): void {
    target.on(this.name, function () {
      callback();
    });
  }
}
