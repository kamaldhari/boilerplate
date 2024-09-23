import { Injectable, NestMiddleware, Next } from "@nestjs/common";
import { decodeUserToken } from "../helpers/jwt";
import { ER_UNAUTHENTICATED_CLIENT } from "../constants/errorMessages.constants";
import { UserService } from "../service/user.service";

@Injectable()
export class ApiAuthMiddleware implements NestMiddleware {
  constructor(private readonly userService: UserService) {}

  async use(req: any, res: any, @Next() next: any) {
    try {
      let token = req.headers.authorization || false;
      if (token?.startsWith("Bearer ")) {
        token = token.slice(7, token.length);
        const decodedToken = decodeUserToken(token);
        const _userId = decodedToken._userId || false;
        const tokenIP = decodedToken.ip || false;
        if (_userId && tokenIP) {
          const query = {
            _id: _userId,
          };

          const user = await this.userService.findOneUser(query);

          const verifiedToken = user.tokens.find((tok) => token === tok.token);

          if (verifiedToken) {
            req.userId = _userId;
            req.token = token;
            return next();
          }
        }
      }

      const apiResponse = {
        statusCode: ER_UNAUTHENTICATED_CLIENT.statusCode,
        error: {
          message: ER_UNAUTHENTICATED_CLIENT.message,
          code: ER_UNAUTHENTICATED_CLIENT.code,
          field: ER_UNAUTHENTICATED_CLIENT.field,
          type: ER_UNAUTHENTICATED_CLIENT.type,
        },
      };
      return res.status(ER_UNAUTHENTICATED_CLIENT.statusCode).send(apiResponse);
    } catch (error) {
      const apiResponse = {
        statusCode: ER_UNAUTHENTICATED_CLIENT.statusCode,
        error: {
          message: ER_UNAUTHENTICATED_CLIENT.message,
          code: ER_UNAUTHENTICATED_CLIENT.code,
          field: ER_UNAUTHENTICATED_CLIENT.field,
          type: ER_UNAUTHENTICATED_CLIENT.type,
        },
      };

      return res.status(ER_UNAUTHENTICATED_CLIENT.statusCode).send(apiResponse);
    }
  }
}
