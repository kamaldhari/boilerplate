import { RequestMethod } from "@nestjs/common";

export const excludeArray = [
  { path: "user/login", method: RequestMethod.POST },
  { path: "user/signup", method: RequestMethod.POST },
  { path: "user/find-by-key/:key", method: RequestMethod.PUT },
  { path: "user/set-password", method: RequestMethod.PUT },
  { path: "user/reset-password", method: RequestMethod.PUT },
  { path: "user/forget-password", method: RequestMethod.PUT },
  { path: "user/key-verify/:key", method: RequestMethod.GET },
];
