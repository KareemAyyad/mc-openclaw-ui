type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const CURRENT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[CURRENT_LEVEL];
}

function formatMessage(level: LogLevel, context: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
  return data !== undefined ? `${base} ${JSON.stringify(data)}` : base;
}

/**
 * Structured logger with context and log levels.
 * Use `logger.create('ModuleName')` to get a scoped logger.
 */
export function createLogger(context: string) {
  return {
    debug(message: string, data?: unknown) {
      if (shouldLog('debug')) console.debug(formatMessage('debug', context, message, data));
    },
    info(message: string, data?: unknown) {
      if (shouldLog('info')) console.log(formatMessage('info', context, message, data));
    },
    warn(message: string, data?: unknown) {
      if (shouldLog('warn')) console.warn(formatMessage('warn', context, message, data));
    },
    error(message: string, data?: unknown) {
      if (shouldLog('error')) console.error(formatMessage('error', context, message, data));
    },
  };
}
