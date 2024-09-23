/* eslint-disable radix */
/**
 * Config object
 */

import * as dotenv from "dotenv";

dotenv.config();

const host = process.env.FRONTEND_HOST;
const port = process.env.FRONTEND_PORT;
const baseUrl = `${host}:${port}`;
export const CONFIG = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  baseUrl: process.env.BASE_URL,
  mongo: {
    host: process.env.DB_HOST,
    dbName: process.env.DB_NAME,
    port: process.env.DB_PORT,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    authSource: process.env.DB_AUTH_SOURCE,
    caFile: process.env.DB_CA_FILE,
    isSSL: process.env.DB_SSL,
  },
  jwtConfig: {
    secret: process.env.JWT_SECRET,
    expiryTime: process.env.JWT_EXPIRT_TIME,
  },
  cryptoConfig: {
    userPasswordCommonSalt: process.env.USER_PASSWORD_COMMON_SALT,
    seceretKey: process.env.CYPTO_SECERET_KEY,
  },
  s3BucketConfig: {
    baseUrl: process.env.S3_BASE_URL,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
  },
  emailConfig: {
    service: process.env.EMAIL_SERVICE || "",
    host: process.env.EMAIL_HOST || "",
    port: parseInt(process.env.EMAIL_port),
    senderUser: process.env.EMAIL_SENDER_USER || "",
    senderID: process.env.EMAIL_SENDER_ID || "",
    senderPassword: process.env.EMAIL_SENDER_PASSWORD || "",
  },
  frontendConfig: {
    host: process.env.FRONTEND_HOST,
    port: parseInt(process.env.FRONTEND_PORT) || false,
    baseUrl: `${baseUrl}/`,
    baseUrlNoSlash: `${baseUrl}`,
    resetPasswordSlug: process.env.FRONTEND_RESET_PASSWORD_SLUG,
    setPasswordSlug: process.env.FRONTEND_SET_PASSWORD_SLUG,
  },
};
