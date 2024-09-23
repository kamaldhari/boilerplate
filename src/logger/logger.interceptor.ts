// logger.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger("LoggerInterceptor");
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const callSite: string = context.getClass().name;
    const method: string = context.getHandler().name;

    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const route = request.route;
    const apiRoute = route ? route.path : "Unknown Route";
    const httpMethod = request.method;

    this.logger.log(`Route: [${httpMethod}] ${apiRoute} ${Date.now() - now}ms`);
    this.logger.log(`Inside ${callSite}`);
    this.logger.log(`Inside method ${method}`);

    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(`After method ${method} ${Date.now() - now}ms`),
        ),
      );
  }
}
