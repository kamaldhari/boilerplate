import { CONFIG } from "config";
import * as CryptoJS from "crypto-js";

const CryptoSecretKey = CONFIG.cryptoConfig.seceretKey;

export const encryptData = <T>(data: T): string => {
  if (data) {
    const ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      CryptoSecretKey,
    ).toString();
    return ciphertext;
  }
  return "";
};

export const decryptData = <T>(ciphertext: string): T => {
  if (ciphertext && typeof ciphertext === "string") {
    const bytes = CryptoJS.AES.decrypt(ciphertext, CryptoSecretKey);
    const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) as T;
    return decryptedData;
  }
  return {} as T;
};
export const encodeBase64 = (data: string): string => {
  return btoa(data);
};

export const decodeBase64 = (data: string): string => {
  return atob(data);
};
