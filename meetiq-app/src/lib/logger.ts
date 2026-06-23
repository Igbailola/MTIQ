type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  source?: string;
}

function formatEntry(entry: LogEntry): string {
  const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`];
  if (entry.source) parts.push(`[${entry.source}]`);
  parts.push(entry.message);
  return parts.join(' ');
}

function log(level: LogLevel, message: string, data?: unknown, source?: string) {
  const entry: LogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
    source,
  };
  const formatted = formatEntry(entry);
  switch (level) {
    case 'error':
      console.error(formatted, data ?? '');
      break;
    case 'warn':
      console.warn(formatted, data ?? '');
      break;
    case 'info':
      console.info(formatted, data ?? '');
      break;
    case 'debug':
      console.debug(formatted, data ?? '');
      break;
  }
}

export const logger = {
  error: (message: string, data?: unknown, source?: string) => log('error', message, data, source),
  warn: (message: string, data?: unknown, source?: string) => log('warn', message, data, source),
  info: (message: string, data?: unknown, source?: string) => log('info', message, data, source),
  debug: (message: string, data?: unknown, source?: string) => log('debug', message, data, source),
};
