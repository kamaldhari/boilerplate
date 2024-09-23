import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction } from "express";

@Injectable()
export class ApiNotFoundMiddleware implements NestMiddleware {
  use(req: any, res: any, next: NextFunction) {
    next();
  }
}
