import * as winston from "winston";

const alignColorsAndTime = winston.format?.combine(
  winston.format.colorize({
    all: true,
  }),
  winston.format.label({
    label: "[LOGGER]",
  }),
  winston.format.timestamp({}),
  winston.format.printf(
    (info) =>
      `[${info.timestamp}]: ${info.label} ${info.level} : ${info.message}`,
  ),
);

const logger = winston.createLogger({
  level: "debug",
  transports: [
    new winston.transports.Console({
      format: winston.format?.combine(
        winston.format.colorize(),
        alignColorsAndTime,
      ),
    }),
    new winston.transports.File({
      filename: "logs/apiSuccess.log",
    }),
    new winston.transports.File({
      level: "error",
      filename: "logs/error.log",
    }),
  ],
});

export default logger;
