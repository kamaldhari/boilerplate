import { HttpException, HttpStatus } from "@nestjs/common";
import logger from "utils/logger";

export const errorMessageHandle = (
  error: { message: string },
  methodName: string,
) => {
  logger?.error(`${methodName} - Error: `, error);
  const errorMessage = error?.message || "Internal server error";
  const statusCode =
    error instanceof HttpException
      ? error?.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  throw new HttpException(
    {
      status: statusCode,
      message: errorMessage,
    },
    statusCode,
  );
};
