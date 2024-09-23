/* eslint-disable @typescript-eslint/no-unused-vars */
import { ApiError } from "../utils/api-error";
/**
 * Makes custom errors
 * @param {number} statusCode
 * @param {string} code
 * @param {string} message
 * @param {string} type
 * @param {string} field
 * @returns {error}
 */
const makeError = (
  statusCode: number,
  code: string,
  message: string,
  type = undefined,
  field = undefined,
) => {
  const error = new ApiError(statusCode, message);
  error.statusCode = statusCode;
  error.message = message;
  return error;
};

export const ER_PASSWORD_NOT_GENERATED = makeError(
  403,
  "ER_PASSWORD_NOT_GENERATED",
  "Password has still not been generated for this user.",
  "FIELD_VALIDATION",
  "password",
);

export const ER_USER_ALREADY_EXISTS = makeError(
  403,
  "ER_USER_ALREADY_EXISTS",
  "A user with requested email id already exists.",
  "DUPLICATE_ENTRY",
  "emailId",
);

export const ER_USER_BLOCKED = makeError(
  406,
  "ER_USER_BLOCKED",
  "User has been blocked by admin.",
  "AUTHORIZATION",
);

export const ER_USER_EMAIL_ALREADY_EXISTS = makeError(
  403,
  "ER_USER_EMAIL_ALREADY_EXISTS",
  "A user with requested email already exists.",
  "DUPLICATE_ENTRY",
  "email",
);

export const ER_WRONG_PASSWORD = makeError(
  403,
  "ER_WRONG_PASSWORD",
  "Email or Password is incorrect.",
  "AUTHORIZATION",
);

export const ER_USER_NOT_FOUND = makeError(
  404,
  "ER_USER_NOT_FOUND",
  "User does not exist",
  "DOCUMENT_UNFOUND",
);

export const ER_KEY_EXPIRED = makeError(
  403,
  "ER_KEY_EXPIRED",
  "The key has been expired. Please request a new.",
  "AUTHORIZATION",
);

export const ER_LINK_EXPIRED = makeError(
  403,
  "ER_LINK_EXPIRED",
  "Link has expired, please request a new one",
  "AUTHORIZATION",
);

export const ER_INVALID_FIELD = (
  field = "field",
  message = "is invalid.",
  code = "ER_INVALID_FIELD",
  type = "FIELD_VALIDATION",
) => makeError(406, code, `${field} ${message}`, type, field);

export const ER_CHANGE_WRONG_PASSWORD = makeError(
  403,
  "ER_CHANGE_WRONG_PASSWORD",
  "The old password is wrong.",
  "AUTHORIZATION",
);

export const ER_BAD_REQUEST = makeError(
  400,
  "ER_BAD_REQUEST",
  "Improper request to API call.",
  "REQUEST_VALIDATION",
);

export const ER_UNAUTHENTICATED_CLIENT = makeError(
  401,
  "ER_UNAUTHENTICATED_CLIENT",
  "Unauthenticated client access to API.",
  "AUTHENTICATION",
);

export const ER_WRONG_EMAIL = makeError(
  403,
  "ER_WRONG_EMAIL",
  "Email is incorrect.",
  "AUTHORIZATION",
);

export const ER_CATEGORY_ALREADY_EXIST = makeError(
  403,
  "ER_CATEGORY_ALREADY_EXIST",
  "Categorie Name already exits",
  "AUTHORIZATION",
);
