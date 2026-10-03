const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
} as const;

type LogLevel = (typeof LOG_LEVELS)[keyof typeof LOG_LEVELS];

interface LogMeta {
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, meta: LogMeta = {}): void {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message, ...meta };

  if (process.env.NODE_ENV === "development") {
    console.log(JSON.stringify(logEntry, null, 2));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

export const logger = {
  error: (message: string, meta?: LogMeta) =>
    log(LOG_LEVELS.ERROR, message, meta),
  warn: (message: string, meta?: LogMeta) =>
    log(LOG_LEVELS.WARN, message, meta),
  info: (message: string, meta?: LogMeta) =>
    log(LOG_LEVELS.INFO, message, meta),
  debug: (message: string, meta?: LogMeta) =>
    log(LOG_LEVELS.DEBUG, message, meta),
};
