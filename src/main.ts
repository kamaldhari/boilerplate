import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
import { CONFIG } from "config";
import logger from "utils/logger";
import "./include/mongodb.connection";
import * as morgan from "morgan";
import * as cors from "cors";
import * as bodyParser from "body-parser";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { createSocketIOServer } from "helpers/socket";
import { LoggerInterceptor } from "logger/logger.interceptor";

import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalInterceptors(new LoggerInterceptor());
  app.use(cors());
  app.setGlobalPrefix("v1");
  app.use(morgan("tiny"));
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

  const configSwagger = new DocumentBuilder()
    .setTitle("Boiler plate")
    .setDescription("Boiler plate API description")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, configSwagger);
  SwaggerModule.setup("api", app, document);

  const httpServer = app.getHttpServer();
  createSocketIOServer(httpServer);

  await app.listen(CONFIG.port, async () => {
    logger?.info(
      `Doccine server listening on ${CONFIG.port} in ${CONFIG.env} mode`,
    );
    logger.info(`Application is running on: ${await app.getUrl()}`);
  });
}
bootstrap();
