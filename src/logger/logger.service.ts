// logger.service.ts
import { Injectable } from "@nestjs/common";
import pino from "pino";

@Injectable()
export class LoggerService {
  private logger: pino.Logger;

  constructor() {
    this.logger = pino();
  }

  log(message: string, context?: string) {
    const logMessage = context ? `[${context}] ${message}` : message;
    this.logger.info(logMessage);
  }
}
