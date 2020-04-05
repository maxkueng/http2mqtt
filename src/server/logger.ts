import {
  Logger,
  createLogger,
  transports,
  format,
} from 'winston';

export default class LogManager {
  logger: Logger;

  loggers: Map<string, Logger> = new Map();

  constructor() {
    this.logger = createLogger({
      level: 'debug',
      format: format.combine(format.colorize(), format.prettyPrint()),
      transports: [new transports.Console()],
    });
  }

  getLogger(name?: string): Logger {
    if (!name) {
      return this.logger;
    }

    if (!this.loggers.has(name)) {
      const childLogger = this.logger.child({ module: name });
      this.loggers.set(name, childLogger);
      return childLogger;
    }

    const logger = this.loggers.get(name);
    if (!logger) {
      throw new Error('No logger');
    }
    return logger;
  }
}
