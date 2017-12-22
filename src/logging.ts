import {app} from 'electron';
import * as moment from 'moment';

const path = require('path');
const fs = require('fs-extra');
const log = require('electron-log');


export interface Logger {
  debug(m: string);
  info(m: string);
  warn(m: string);
  error(m: string);
}

function fileSafeDateFormat(d: Date): string {
  const m = moment(d);
  const date = m.format('YYYY-MM-DD');
  const time = m.format('HH-mm-ss');
  return `app_${date}_${time}`;
}

export function getLogger(): Logger {
  return log;
}

export function configureLogging() {
  const logLevel = getConfiguredLogLevel();

  log.transports.console.level = logLevel;

  const userDataPath = app.getPath('userData');
  const logPath = path.join(userDataPath, 'logs');
  fs.mkdirp(logPath);

  const appStartAt = fileSafeDateFormat(new Date());
  const logFile = path.join(logPath, `${appStartAt}.log`);

  log.transports.file.level = logLevel;
  log.transports.file.file = logFile;
}

function getConfiguredLogLevel() {
  const raw = process.env.TANDEM_LOG_LEVEL;
  const sanitised = (raw || '').toLowerCase();

  switch (sanitised) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warn';
    case 'info':
      return 'info';
    case 'debug':
      return 'debug';
    default:
      return 'warn';
  }
}
