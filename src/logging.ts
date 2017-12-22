import {app} from 'electron';
import * as moment from 'moment';

const path = require('path');
const fs = require('fs-extra');
const log = require('electron-log');


export interface Logger {
  debug(m: string);

  debugSensitive(m: string, value: any);

  info(m: string);

  warn(m: string);

  warnSensitive(m: string, value: any);

  error(m: string);

  errorSensitive(m: string, value: any);
}

function fileSafeDateFormat(d: Date): string {
  const m = moment(d);
  const date = m.format('YYYY-MM-DD');
  const time = m.format('HH-mm-ss');
  return `app_${date}_${time}`;
}

export function getLogger(): Logger {
  return new RedactingLogger(log, getConfiguredPrintSensitiveValuesInLogs());
}

class RedactingLogger implements Logger {
  private showSensitiveValues: boolean;

  constructor(private log, configuredPrintSensitiveValuesInLogs: boolean) {
    this.showSensitiveValues = configuredPrintSensitiveValuesInLogs;
  }

  debug(m: string) {
    this.log.debug(m);
  }

  debugSensitive(m: string, value: string) {
    this.debug(this.buildSensitiveMessage(m, value));
  }

  info(m: string) {
    this.log.info(m);
  }

  warn(m: string) {
    this.log.warn(m);
  }

  warnSensitive(m: string, value: string) {
    this.warn(this.buildSensitiveMessage(m, value));
  }

  error(m: string) {
    this.log.error(m);
  }

  errorSensitive(m: string, value: string) {
    this.error(this.buildSensitiveMessage(m, value));
  }

  private buildSensitiveMessage(m: string, v: any): string {
    if (this.showSensitiveValues) {
      return `${m} ${v}`;
    } else {
      return `${m} #####`;
    }
  }
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

function getConfiguredPrintSensitiveValuesInLogs(): boolean {
  const raw: string = process.env.TANDEM_PRINT_SENSITIVE_VALUES_IN_LOGS;
  const sanitised = (raw || '').toLowerCase();
  return sanitised === 'true';
}
