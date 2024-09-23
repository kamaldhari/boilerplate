import * as jwt from "jsonwebtoken";
import { CONFIG } from "../../config";
/**
 * Decode user api token
 * @param {*} token
 * @returns {*}
 */
const decodeUserToken = (token) => {
  try {
    const decodedToken = jwt.verify(token, CONFIG.jwtConfig.secret);
    return decodedToken;
  } catch (error) {
    return false;
  }
};

/**
 * Generate user api token
 * @param {*} _userId
 * @returns {*}
 */
const generateUserToken = (_userId, ip, type = "") => {
  const generateToken = jwt.sign(
    { _userId, ip, type },
    CONFIG.jwtConfig.secret,
    {
      expiresIn: `${CONFIG.jwtConfig.expiryTime}`,
    },
  );
  return generateToken;
};

export { decodeUserToken, generateUserToken };
