import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { S3FileUploadService } from "./helpers/fileHandler";
import UserController from "./controller/user.controller";
import { excludeArray } from "./app.module.config";
import {
  ApiAuthMiddleware,
  ApiNotFoundMiddleware,
  ErrorHandlerMiddleware,
} from "./middleware";
import { BlogService } from "./service/blog.service";
import { BlogController } from "./controller/blog.controller";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [UserController, BlogController],
  providers: [S3FileUploadService, BlogService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiAuthMiddleware)
      .exclude(...excludeArray)
      .forRoutes("*");

    consumer.apply(ApiNotFoundMiddleware).forRoutes("*");
    consumer.apply(ErrorHandlerMiddleware).forRoutes("*");
  }
}
