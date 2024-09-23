import * as crypto from "crypto";
import { CONFIG } from "../../config";
const generateRandomSalt = (): string => crypto.randomBytes(16).toString("hex");

const generatePasswordHash = (randomSalt, password) => {
  const commonSalt = CONFIG.cryptoConfig.userPasswordCommonSalt;
  const salt = commonSalt.concat(randomSalt);
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
};

const generateKeyHash = (key) =>
  crypto
    .pbkdf2Sync(key, generateRandomSalt(), 1000, 16, "sha512")
    .toString("hex");

const generateUUID = (length = 4, options = { numericOnly: false }) => {
  let text = "";
  const possible = options?.numericOnly
    ? "0123456789"
    : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export {
  generatePasswordHash,
  generateKeyHash,
  generateUUID,
  generateRandomSalt,
};
