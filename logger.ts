import { createLogger, format, transports, Logger } from "winston";

let logger: Logger;

export function setupLogger() {
  logger = createLogger({
    level: "info",
    format: format.combine(
      format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      format.colorize(),
      format.printf((info) => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`)
    ),
    transports: [new transports.Console()],
  });

  logger.verbose("Logger initialized", { label: "logger" });
}

export class LabelledLogger {
  constructor(private label: string) {}

  silly(message: string) {
    logger.silly(message, { label: this.label });
  }

  debug(message: string) {
    logger.debug(message, { label: this.label });
  }

  verbose(message: string) {
    logger.verbose(message, { label: this.label });
  }

  http(message: string) {
    logger.http(message, { label: this.label });
  }

  info(message: string) {
    logger.info(message, { label: this.label });
  }

  warn(message: string) {
    logger.warn(message, { label: this.label });
  }

  error(message: string) {
    logger.error(message, { label: this.label });
  }
}