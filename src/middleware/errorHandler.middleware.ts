import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction } from "express";
import { ER_BAD_REQUEST } from "../constants/errorMessages.constants";

@Injectable()
export class ErrorHandlerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: NextFunction) {
    if (res?.locals?.error) {
      const { error } = res.locals;
      const message = error.message || ER_BAD_REQUEST.message;
      const code = error.code || ER_BAD_REQUEST.code;
      const { field } = error;
      const type = error.type || ER_BAD_REQUEST.type;
      const statusCode = error.statusCode || ER_BAD_REQUEST.statusCode;
      const status = false;

      const apiResponse = {
        statusCode,
        error: {
          message,
          code,
          field,
          type,
        },
        status,
        message,
      };

      res.status(statusCode).json(apiResponse);
    }
    next();
  }
}
