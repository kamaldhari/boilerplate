import { ApiTags } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Headers,
  Put,
  Req,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { UserService } from "../service/user.service";
import { UserLogin } from "../dto/user/userLoginDto";
import { UserAdd } from "../dto/user/userAdd";
import { UpdateUserDto } from "../dto/user/updateUserDto";
import { DeleteUser } from "../dto/user/deleteDto";
import { UserApprovalDto } from "../dto/user/approvalDto";
import { UserBlockDto } from "../dto/user/blockDto";
import { ForgetPwdDto } from "../dto/user/forgetPwdDto";
import { SetPwdDto } from "../dto/user/setPwdDto";
import { ResetPwdDto } from "../dto/user/resetPwdDto";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { S3FileUploadService } from "../helpers/fileHandler";
import { ChangePasswordDto } from "../dto/user/changePwdDto";
import { CustomHeaders } from "../interface/header.interface";
import { Request } from "express";
import { CustomRequest } from "interface/request.interface";
import logger from "utils/logger";
import {
  decodeBase64,
  decryptData,
  encryptData,
} from "helpers/common/cyptojs.contants";
import { errorMessageHandle } from "helpers/common/error-handle";

@ApiTags("User")
@Controller("user")
export default class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly s3FileUploadService: S3FileUploadService,
  ) {}

  /**
   * User login
   * @param body ]
   * @param headers
   * @param req
   * @returns
   */
  @Post("/login")
  async userLogin(
    @Body() body: UserLogin,
    @Headers() headers: CustomHeaders,
    @Req() req: Request,
  ) {
    try {
      const decryptedData: UserLogin = decryptData(body.data);

      const decodedBase = {
        ...decryptedData,
        password: decodeBase64(decryptedData.password),
      };

      const ip = decryptedData?.userActivity?.ip
        ? decryptedData?.userActivity?.ip
        : "";
      const location = decryptedData?.userActivity?.location
        ? decryptedData?.userActivity?.location
        : "None";
      const deviceType =
        req?.useragent.platform + " (" + req?.useragent.os + ")";
      const browserName = req?.useragent.browser + "/" + req?.useragent.version;
      const loginTime = new Date();
      const response = await this.userService.userLogin(
        decodedBase,
        ip,
        location,
        browserName,
        deviceType,
        loginTime,
        false,
      );
      return encryptData(response);
    } catch (error) {
      errorMessageHandle(error, "userLogin");
    }
  }

  /**
   * User logout
   * @param req
   * @returns
   */
  @Post("/logout")
  async userLogout(@Req() req: any, @Headers() headers: CustomHeaders) {
    try {
      const ip = headers.ipaddress;
      const location = headers.location;
      const deviceType =
        req?.useragent.platform + " (" + req?.useragent.os + ")";
      const browserName = req?.useragent.browser + "/" + req?.useragent.version;
      const loginTime = new Date();
      return this.userService.userLogout(
        req.userId,
        req.token,
        ip,
        location,
        deviceType,
        browserName,
        loginTime,
      );
    } catch (error) {
      logger?.error("userLogout - Error: ", error);
    }
  }

  /**
   * get daya by user id
   * @param key
   * @param Headers
   * @param req
   * @returns
   */
  @Put("find-by-key/:key")
  async userFindByKey(
    @Param("key") key: string,
    @Headers() Headers: CustomHeaders,
    @Req() req: Request,
  ) {
    try {
      const ip = Headers["x-real-ip"] || req.socket.remoteAddress;
      return await this.userService.userFindByKey(key, ip);
    } catch (error) {
      logger?.error("userFindByKey - Error: ", error);
    }
  }

  /**
   * signup
   * @param body
   * @returns
   */
  @Post("/signup")
  async userAdd(@Body() body: UserAdd) {
    try {
      const decryptedData: UserLogin = decryptData(body.data);
      const decodedBase = {
        ...decryptedData,
        password: decodeBase64(decryptedData.password),
      };
      const response = await this.userService.userAdd(decodedBase);
      return encryptData(response);
    } catch (error) {
      errorMessageHandle(error, "userAdd");
    }
  }

  /**
   * Update User
   * @param userId
   * @param body
   * @param req
   * @param files
   * @returns
   */
  @Put("/update/:userId")
  @UseInterceptors(AnyFilesInterceptor())
  async userUpdate(
    @Param("userId") userId: string,
    @Body() body: UpdateUserDto,
    @Req() req: any,
    @UploadedFiles() files: any[],
  ) {
    try {
      let uploadedImage = [];
      if (files && files.length > 0) {
        uploadedImage = await this.s3FileUploadService.uploadFile(
          files,
          req.originalUrl,
        );
      }

      body.updatedBy = req?.userId;

      const response = await this.userService.userUpdate(
        userId,
        body,
        uploadedImage && uploadedImage.length > 0 ? uploadedImage[0] : [],
      );

      return response;
    } catch (error) {
      logger?.error("userUpdate - Error: ", error);
    }
  }

  /**
   * Delete user
   * @param body
   * @param req
   * @returns
   */
  @Delete("/delete")
  async userDelete(@Body() body: DeleteUser, @Req() req: CustomRequest) {
    try {
      body.updatedBy = req.userId;

      return await this.userService.userDelete(body);
    } catch (error) {
      logger?.error("userDelete - Error: ", error);
    }
  }

  /**
   * User approval
   * @param body
   * @param req
   * @returns
   */
  @Put("/approval")
  async userApproval(@Body() body: UserApprovalDto, @Req() req: CustomRequest) {
    try {
      body.updatedBy = req.userId;

      return await this.userService.userApproval(body);
    } catch (error) {
      logger?.error("userApproval - Error: ", error);
    }
  }

  /**
   * Block user
   * @param req
   * @param body
   * @returns
   */
  @Put("/blocking")
  async userBlocking(@Req() req: CustomRequest, @Body() body: UserBlockDto) {
    try {
      body.updatedBy = req.userId;

      return await this.userService.userBlocking(body, req.session);
    } catch (error) {
      logger?.error("userBlocking - Error: ", error);
    }
  }

  /**
   * Forgot Password
   * @param body
   * @returns
   */
  @Put("/forget-password")
  async userForgotPassword(@Body() body: ForgetPwdDto) {
    try {
      return await this.userService.userForgotPassword(body);
    } catch (error) {
      logger?.error("userForgotPassword - Error: ", error);
    }
  }

  /**
   * Set Password
   * @param req
   * @param body
   * @param headers
   * @returns
   */
  @Put("/set-password")
  async userPasswordSet(
    @Req() req: CustomRequest,
    @Body() body: SetPwdDto,
    @Headers() headers: CustomHeaders,
  ) {
    try {
      const ip = headers["x-real-ip"];
      return await this.userService.userPasswordSet(body, ip);
    } catch (error) {
      logger?.error("userPasswordSet - Error: ", error);
    }
  }

  /**
   * Reset Password
   * @param body
   * @returns
   */
  @Put("/reset-password")
  async userPasswordReset(@Body() body: ResetPwdDto) {
    try {
      return await this.userService.userPasswordReset(body);
    } catch (error) {
      logger?.error("userPasswordReset - Error: ", error);
    }
  }

  /**
   * get user by user id
   * @param id
   * @returns
   */
  @Put("/get-user-by-id/:id")
  async getUserById(@Param("id") id: string) {
    try {
      return await this.userService.getUserById(id);
    } catch (error) {
      logger?.error("getUserById - Error: ", error);
    }
  }

  /**
   * Change Password
   * @param req
   * @param body
   * @returns
   */
  @Put("/change-password")
  async userChangePassword(@Body() body: ChangePasswordDto) {
    try {
      return await this.userService.userChangePassword(body);
    } catch (error) {
      logger?.error("userChangePassword - Error: ", error);
    }
  }

  /**
   * Verification mail send
   * @param id
   * @param req
   * @returns
   */
  @Get("/verification-email/:id?")
  async sendVerificationEmail(
    @Param("id") id: string,
    @Req() req: CustomRequest,
  ) {
    try {
      const updatedBy = {
        user: req.userId,
      };
      return await this.userService.sendVerificationEmail(id, updatedBy);
    } catch (error) {
      logger?.error("sendVerificationEmail - Error: ", error);
    }
  }

  @Get("key-verify/:key")
  async linkExpired(@Param("key") key: string) {
    try {
      return await this.userService.linkExpired(key);
    } catch (error) {
      logger?.error("linkExpired - Error: ", error);
    }
  }

  @Post("import-csv")
  @UseInterceptors(AnyFilesInterceptor())
  async importCSV(@UploadedFiles() file: any[]) {
    try {
      return await this.userService.importCSV(file);
    } catch (error) {
      logger?.error("importCSV - Error: ", error);
    }
  }
}
