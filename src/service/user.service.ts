/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { MessageTemplateDTO } from "dto/messageTemplate/messageTemplate.dto";

import { messageTemplatesModel } from "models/emailTemplate.model";
import { ObjectId } from 'mongodb';
import logger from "utils/logger";
import {
  ER_CHANGE_WRONG_PASSWORD,
  ER_INVALID_FIELD,
  ER_KEY_EXPIRED,
  ER_LINK_EXPIRED,
  ER_PASSWORD_NOT_GENERATED,
  ER_USER_ALREADY_EXISTS,
  ER_USER_BLOCKED,
  ER_USER_EMAIL_ALREADY_EXISTS,
  ER_USER_NOT_FOUND,
  ER_WRONG_EMAIL,
  ER_WRONG_PASSWORD,
} from "../constants/errorMessages.constants";
import { userProjectionFields } from "../constants/projectionFields.constants";
import { iterateObject, parseCSV } from "../helpers/common/common";
import {
  generateKeyHash,
  generatePasswordHash,
  generateRandomSalt,
} from "../helpers/encrypto";
import { decodeUserToken, generateUserToken } from "../helpers/jwt";
import { sendEmail } from "../mailer";
import { userModel } from "../models/user.model";
import { errorMessageHandle } from "helpers/common/error-handle";

@Injectable()
export class UserService {

  async findAllUsers(
    filter = {},
    projection = userProjectionFields,
    pagination = { pageNo: 1, pageSize: 0 },
    sort = {},
    expandSearch = false,
  ) {
    try {
      let result: any = userModel;
      const { pageNo, pageSize } = pagination;
      if (pageNo > 0 || pageSize > 0) {
        result = result.find(filter, projection, {
          skip: (pageNo - 1) * pageSize,
          limit: pageSize,
        });
      } else {
        result = result.find(filter, projection);
      }
      if (Object.keys(sort).length) {
        result = result.sort(sort);
      }

      if (expandSearch) {
        result = result
          .populate("createdBy", userProjectionFields)
          .populate("updatedBy", userProjectionFields);
      }
      const responseData = await result.lean();
      return responseData;
    } catch (error) {
      logger?.error("findAllUsers - Error: ", error);
    }
  }

  async findOneUser(
    filter,
    projection = userProjectionFields,
    expandSearch = false,
  ) {
    try {
      let result = userModel.findOne(filter, { ...projection });

      if (expandSearch) {
        result = result
          .populate("createdBy.admin", userProjectionFields)
          .populate("createdBy.user", userProjectionFields)
          .populate("updatedBy.admin", userProjectionFields)
          .populate("updatedBy.user", userProjectionFields);
      }
      return await result.lean();
    } catch (error) {
      logger?.error("findOneUser - Error: ", error);
    }
  }

  async insertOneUser(data) {
    try {
      const userData = new userModel(data);
      return await userData.save();
    } catch (error) {
      logger?.error("insertOneUser - Error: ", error);
    }
  }

  async updateOneUser(
    filter,
    reflection,
    projection = userProjectionFields,
    expandSearch = false,
  ) {
    try {
      const options = {
        upsert: false,
        returnOriginal: false,
        projection,
      };

      let result = userModel
        .findOneAndUpdate(filter, reflection, options)
        .lean();

      if (expandSearch) {
        result = result
          .populate("createdBy.admin", userProjectionFields)
          .populate("createdBy.user", userProjectionFields)
          .populate("updatedBy.admin", userProjectionFields)
          .populate("updatedBy.user", userProjectionFields);
      }
      return await result.lean();
    } catch (error) {
      logger?.error("updateOneUser - Error: ", error);
    }
  }

  async updateManyUsers(filter, reflection, projection = userProjectionFields) {
    try {
      await userModel
        .updateMany(filter, reflection, {
          upsert: false,
        })
        .lean();
      return await this.findAllUsers(
        filter,
        projection,
        undefined,
        undefined,
        true,
      );
    } catch (error) {
      logger?.error("updateManyUsers - Error: ", error);
    }
  }

  async updateUserVerified(userId, projection = userProjectionFields) {
    try {
      const data = await this.findOneUser({ _id: userId, isDeleted: false });
      let flagVerified = false;

      if (data?.firstName && data?.lastName && data.contact && data.emailId) {
        flagVerified = true;
      }

      const filter = { _id: userId };
      const reflection = { isVerified: flagVerified };
      projection.isVerified = 1;
      return await this.updateOneUser(filter, reflection, projection, true);
    } catch (error) {
      logger?.error("updateUserVerified - Error: ", error);
    }
  }

  async countUsers(filter) {
    try {
      return await userModel.countDocuments(filter);
    } catch (error) {
      logger?.error("countUsers - Error: ", error);
    }
  }

  async userLogin(
    body,
    ip,
    location = undefined,
    browserName = undefined,
    deviceType = undefined,
    loginTime = undefined,
    encryption = undefined,
  ) {
    const validRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    interface Filter {
      isDeleted?: boolean;
      emailId?: string;
      userName?: string;
      _id?: string; // Assuming _id is of type string
      isApproved?: string; // Optional field
    }
    let filter: Filter = {};
    if (body?.emailId?.match(validRegex)) {
      filter = {
        emailId: body.emailId,
        isDeleted: false,
      };
    } else {
      filter = {
        userName: body.emailId,
        isDeleted: false,
      };
    }

    const user = await this.findOneUser(filter);

    if (!user) throw ER_USER_NOT_FOUND;
    if (!user?.isActive) throw ER_USER_BLOCKED;
    if (!user?.password) throw ER_PASSWORD_NOT_GENERATED;
    const encryptoPassword =
      encryption === "ignoreEncryption"
        ? body.password
        : generatePasswordHash(user?.password.salt, body.password);

    if (encryptoPassword !== user?.password.hash) throw ER_WRONG_PASSWORD;

    const token = generateUserToken(user?._id, ip);
    const ref1 = {
      $push: {
        tokens: {
          token,
        },
      },
      $set: {
        lastLoginTime: new Date(),
      },
    };
    const updatedUser = await this.updateOneUser(
      filter,
      ref1,
      userProjectionFields,
      true,
    );

    // Find all expired tokens
    const expiredTokens = [];
    updatedUser?.tokens?.forEach((ele) => {
      if (!decodeUserToken(ele?.token)) expiredTokens.push(ele?.token);
    });

    const ref2 = {
      $pull: {
        tokens: {
          token: {
            $in: expiredTokens,
          },
        },
      },
    };

    let response: any = await this.updateOneUser(
      filter,
      ref2,
      userProjectionFields,
      true,
    );

    response.token = token;

    let message = "User logged in.";
    return {
      data: response,
      message,
    };
  }

  async userLogout(
    userId,
    token,
    ip,
    location,
    deviceType,
    browserName,
    loginTime,
  ) {
    try {
      const filter = {
        _id: userId,
      };

      if (!(await this.countUsers(filter))) throw ER_USER_NOT_FOUND;

      const reflection = {
        $pull: {
          tokens: {
            token,
          },
        },
      };
      await this.updateOneUser(filter, reflection, userProjectionFields);

      return {
        data: "",
        message: "User logged out.",
      };
    } catch (error) {
      logger?.error("userLogout - Error: ", error);
    }
  }

  async userAdd(body) {
    try {
      const userExists = await this.countUsers({
        emailId: body.emailId,
        isDeleted: false,
      });

      if (userExists) {
        throw ER_USER_EMAIL_ALREADY_EXISTS;
      }

      let isApproved = "0";
      if (body.isApproved) {
        switch (body.isApproved) {
          case "APPROVE":
            isApproved = "1";
            break;
          case "REJECT":
            isApproved = "-1";
            break;
        }
      }

      body.isApproved = isApproved;
      const userInsertDetails: any = await this.insertOneUser(body);

      const id = userInsertDetails._doc
        ? userInsertDetails._doc._id
        : userInsertDetails._id;

      interface SetType {
        "metadata.key": string;
        "metadata.validityTime": number;
      }

      const currentDate = new Date();
      const futureDate = new Date(currentDate);
      const set: SetType = {
        "metadata.key": generateKeyHash(`${id}`),
        "metadata.validityTime": futureDate.setHours(
          currentDate.getHours() + 24,
        ),
      };

      const reflection = {
        $set: set,
      };

      const filter = { _id: id };

      const updatedUser = await this.updateOneUser(
        filter,
        reflection,
        userProjectionFields,
        true,
      );
      if (updatedUser) {
        const trigger: MessageTemplateDTO = await messageTemplatesModel
          .findOne({ templateName: "email_verification", isActive: true })
          .select("_id");

        if (trigger) {
          sendEmail.userVerificationEmail(updatedUser, trigger._id);
        }
      }
      return {
        statusCode: 201,
        data: updatedUser,
        message: "User Created.",
      };
    } catch (error) {
      errorMessageHandle(error, "userAdd");
    }
  }

  async userUpdate(userId, body, file) {
    try {
      if (!(await this.countUsers({ _id: userId, isDeleted: false }))) {
        throw ER_USER_NOT_FOUND;
      }
  
      const user = await userModel.findById(userId).lean();
      const { image, flagUpdateImage } = this.prepareUpdateDetails(user, body, file);
  
      if (await this.shouldSendVerificationEmail(user, body)) {
        await this.sendVerificationEmail1(user, body);
      }
  
      await this.checkEmailAvailability(body.emailId, userId);
  
      const updatedFields = this.getUpdatedFields(body, user, flagUpdateImage, image);
      await this.updateUser(userId, updatedFields);
  
      const response = await this.updateUserVerified(userId);
  
      return {
        data: response,
        message: "User updated.",
      };
    } catch (error) {
      logger?.error("userUpdate - Error: ", error);
    }
  }
  
  private prepareUpdateDetails(user, body, file) {
    let flagUpdateImage = false;
    let image = "";
  
    if (user.profileImage) {
      if (file) {
        flagUpdateImage = true;
        image = file.key;
      } else if (file.length === 0) {
        image = undefined;
        flagUpdateImage = true;
      }
    } else if (file) {
      flagUpdateImage = true;
      image = file.key;
    }
  
    const reflection = { $set: {}, $unset: {} };
  
    return { reflection, image, flagUpdateImage };
  }
  
  private async shouldSendVerificationEmail(user, body) {
    return (
      user.isApproved !== "0" &&
      !user.password &&
      user.emailId !== body.emailId
    );
  }
  
  private async sendVerificationEmail1(user, body) {
    const currentDate = new Date();
    const futureDate = new Date(currentDate);
    const reflection = {
      $set: {
        "metadata.key": generateKeyHash(`${String(user._id)}`),
        "metadata.validityTime": futureDate.setHours(currentDate.getHours() + 24),
        updatedBy: body?.updatedBy,
        emailId: body.emailId,
      },
    };
  
    const options = {
      upsert: false,
      returnOriginal: false,
    };
  
    const updatedUser = await userModel.findByIdAndUpdate(user._id, reflection, options).lean();
  
    if (updatedUser) {
      const trigger = await messageTemplatesModel
        .findOne({ templateName: "email_verification", isActive: true })
        .select("_id");
  
      if (trigger) {
        sendEmail.userVerificationEmail(updatedUser, trigger._id.toString());
      }
    }
  
    return {
      isEmailChanged: true,
      password: null,
      tokens: [],
    };
  }
  
  private async checkEmailAvailability(emailId, userId) {
    if (emailId !== userId.emailId) {
      const existingEmailId = await userModel.findOne({
        emailId: emailId,
        _id: { $ne: userId },
      });
      if (existingEmailId) {
        throw ER_USER_ALREADY_EXISTS;
      }
    }
  }
  
  private getUpdatedFields(body, user, flagUpdateImage, image) {
    interface Reflection {
      $set: {
        profileImage?: string;
        [key: string]: any;
      };
      $unset?: {
        [key: string]: any;
      };
    }
    const reflection: Reflection = { $set: {}, $unset: {} };
    let { ...restBody } = body;
  
    restBody = iterateObject(restBody);
    reflection.$set = { ...reflection.$set, ...restBody };
  
    if (flagUpdateImage) {
      if (image && image !== undefined) {
        reflection.$set.profileImage = image;
      } else if (body.profileImage === "") {
        reflection.$set.profileImage = "";
      } else if (body.profileImage === undefined) {
        reflection.$set.profileImage = user.profileImage;
      } else {
        reflection.$set.profileImage = user.profileImage;
      }
    }
  
    return reflection;
  }
  
  private async updateUser(userId, updatedFields) {
    const filter = { _id: userId };
    await this.updateOneUser(filter, updatedFields, userProjectionFields);
  }  

  async userDelete(body) {
    try {
      const filter = {
        _id: { $in: [...body.userIds] },
        isDeleted: false,
      };
      const reflection = {
        $set: {
          isDeleted: true,
          updatedBy: body.updatedBy,
        },
      };

      return {
        data: await this.updateManyUsers(filter, reflection),
        message: "User(s) deleted.",
      };
    } catch (error) {
      logger?.error("userDelete - Error: ", error);
    }
  }

  async userApproval(body) {
    try {
      const { userIds, approval, updatedBy } = body;

      let approvalCode;
      let message;
      switch (approval) {
        case "PENDING":
          approvalCode = "0";
          message = "User approval(s) are set to pending.";
          break;
        case "APPROVE":
          approvalCode = "1";

          message = "User approval(s) are approved.";
          break;
        case "REJECT":
          approvalCode = "-1";
          message = "User approval(s) are rejected.";
          break;
      }

      const filter = { _id: { $in: [] } };
      userIds.forEach((id) => {
        filter._id.$in.push(new ObjectId(String(id)));
      });

      const reflection = {
        $set: {
          isApproved: approvalCode,
          updatedBy,
        },
      };

      const updateData = await this.updateManyUsers(filter, reflection, {
        ...userProjectionFields,
        // metadata: 1,
      });

      switch (approvalCode) {
        case "1":
          for (const user of updateData) {
            const userReflection = {
              $set: {
                "metadata.key": generateKeyHash(`${user._id}`),
                "metadata.validityTime": new Date(new Date()).setHours(
                  new Date().getHours() + 24,
                ),
              },
            };
            const userData = await this.updateOneUser(
              { _id: user._id },
              userReflection,
              userProjectionFields,
            );
            const trigger: MessageTemplateDTO = await messageTemplatesModel
              .findOne({ templateName: "user_approved", isActive: true })
              .select("_id");

            if (trigger) {
              sendEmail.userApproved(userData, trigger._id);
            }
          }
          break;
        case "-1":
          for (const user of updateData) {
            const trigger: MessageTemplateDTO = await messageTemplatesModel
              .findOne({ templateName: "user_reject", isActive: true })
              .select("_id");

            if (trigger) {
              sendEmail.userRejected(user, trigger._id);
            }
          }
          break;
      }

      const data = await userModel
        .find(filter, {
          ...userProjectionFields,
          metadata: 1,
        })
        .lean();

      return {
        data,
        message,
      };
    } catch (error) {
      logger?.error("userApproval - Error: ", error);
    }
  }

  async userBlocking(body, session) {
    try {
      const { userIds, block, updatedBy } = body;

      const filter = { _id: { $in: [] } };
      userIds.forEach((id) => {
        filter._id.$in.push(id);
      });

      const reflection = {
        $set: {
          isActive: !block,
          // tokens: [],
          updatedBy,
        },
      };
      await userModel
        .updateMany(filter, reflection, {
          upsert: false,
        })
        .lean();

      await this.updateManyUsers(filter, reflection);

      return {
        data: await this.updateManyUsers(filter, reflection),
        message: `User(s) are ${block ? "blocked" : "unblocked"}.`,
      };
    } catch (error) {
      logger?.error("userBlocking - Error: ", error);
    }
  }

  async userForgotPassword(body) {
    try {
      const validRegex =
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

      const data = await this.findOneUser({ emailId: body.emailId, isDeleted: false }, userProjectionFields, false);
      if (!data?.isActive) throw ER_USER_BLOCKED;
      if (!data?.password) {
        throw ER_PASSWORD_NOT_GENERATED;
      }

      if (data) {
        if (body?.emailId.match(validRegex)) {
          body.id = new ObjectId(data._id);

          const now = new Date();
          now.setMinutes(now.getMinutes() + 5);
          const date = new Date();
          const reflection = {
            $set: {
              "resetPassword.key": generateRandomSalt(),
              "resetPassword.validityTime": date.setDate(date.getDate() + 24),
            },
          };
          const options = {
            upsert: false,
            returnOriginal: false,
            userProjectionFields,
          };

          const user = await userModel
            .findOneAndUpdate({_id: body.id}, reflection, options)
            .lean();
          const trigger: MessageTemplateDTO = await messageTemplatesModel
            .findOne({ templateName: "reset_password", isActive: true })
            .select("_id");

          if (trigger) {
            sendEmail.userForgotPassword(user, trigger._id);
          }
        } else {
          throw ER_WRONG_EMAIL;
        }
        delete data?.password;

        return {
          data: data,
          message: "Reset password otp sent",
        };
      } else {
        throw ER_USER_NOT_FOUND;
      }
    } catch (error) {
      logger?.error("userForgotPassword - Error: ", error);
    }
  }

  async userPasswordSet(body, ip) {
    try {
      const { key, password } = body;
      const filter = {
        "metadata.key": key,
        isDeleted: false,
      };
      const check = await userModel.findOne(filter, { metadata: 1 }).lean();
      if (!check) {
        throw ER_LINK_EXPIRED;
      } else if (
        new Date(check.metadata?.validityTime).getTime() < new Date().getTime()
      ) {
        throw ER_KEY_EXPIRED;
      }
      const salt = generateRandomSalt();
      const encryptoHash = generatePasswordHash(salt, password);
      const reflection = {
        $set: {
          password: {
            hash: encryptoHash,
            salt,
          },
          isLinkOpened: true,
          isEmailChanged: false,
        },
      };

      const data = await this.updateOneUser(
        filter,
        reflection,
        userProjectionFields,
      );
      if (!data) throw ER_USER_NOT_FOUND;

      const reflectUpdatedBy = {
        $set: {
          updatedBy: data._id,
          isVerified: true,
        },
      };
      await this.updateOneUser(filter, reflectUpdatedBy, userProjectionFields);
      await this.userLogin(
        { emailId: data.emailId, password },
        ip,
        false,
      );
      return {
        message:
          "User password has been set and has been logged in automtically.",
        // data: login.data,
      };
    } catch (error) {
      logger?.error("userPasswordSet - Error: ", error);
    }
  }

  async userPasswordReset(body) {
    try {
      const { keys, password } = body;
      const filter = {
        "resetPassword.key": keys,
        isDeleted: false,
      };
      const check = await userModel
        .findOne(filter, { resetPassword: 1 })
        .lean();
      if (!check) throw ER_LINK_EXPIRED;
      else if (
        new Date(check.resetPassword?.validityTime).getTime() <
        new Date().getTime()
      )
        throw ER_KEY_EXPIRED;

      const salt = generateRandomSalt();
      const encryptoHash = generatePasswordHash(salt, password);

      const reflection = {
        $set: {
          password: {
            hash: encryptoHash,
            salt,
          },
          updatedBy: check._id,
        },
      };
      const data = await this.updateOneUser(
        filter,
        reflection,
        userProjectionFields,
      );

      if (!data) throw ER_USER_NOT_FOUND;

      return {
        message: "User password has been reset.",
        data,
      };
    } catch (error) {
      logger?.error("userPasswordReset - Error: ", error);
    }
  }

  async userFindByKey(key, ip) {
    try {
      let filter = {
        isDeleted: false,
        "metadata.key": key,
      };

      let data = await this.findOneUser(filter, userProjectionFields, false);
      if (!data) {
        throw ER_USER_NOT_FOUND;
      } else if (data.password) {
        await this.userLogin(
          { emailId: data.contact, password: data.password.hash },
          ip,
        );
        return {
          // data: login.data,
          statusCode: 200,
          status: true,
          message: "User found with password and logged in automatically.",
        };
      } else {
        const response = await this.findOneUser(filter, undefined, true);
        return {
          data: response,
          message: "User found without a password set.",
        };
      }
    } catch (error) {
      logger?.error("userFindByKey - Error: ", error);
    }
  }

  async userChangePassword(
    body,
  ) {
    try {
      const userData = await userModel.findOne({ _id: body.id }).lean();
      const { oldPassword } = body;
      if (!userData.password) {
        throw ER_PASSWORD_NOT_GENERATED;
      }

      const encryptoHashOldPassword = generatePasswordHash(
        userData.password.salt,
        oldPassword,
      );

      if (userData.password.hash !== encryptoHashOldPassword)
        throw ER_CHANGE_WRONG_PASSWORD;

      interface Filter {
        isDeleted: boolean;
        _id: string; // Assuming _id is of type string
        isApproved?: string; // Optional field
      }

      const filter: Filter = {
        isDeleted: false,
        _id: body.id,
      };

      const salt = generateRandomSalt();
      const encryptoHash = generatePasswordHash(salt, body.newPassword);
      const reflection = {
        $set: {
          password: {
            hash: encryptoHash,
            salt,
          },
        },
      };

      const data = await userModel.findOneAndUpdate(filter, reflection);
      return {
        message: "User password has been changed.",
        data,
      };
    } catch (error) {
      logger?.error("userChangePassword - Error: ", error);
    }
  }

  async sendVerificationEmail(id, updatedBy) {
    try {
      if (!id) {
        throw ER_INVALID_FIELD(":id", "param is undefined");
      }

      const user = await userModel.findById(new ObjectId(String(id)));
      if (!user) {
        throw ER_USER_NOT_FOUND;
      }
      const date = new Date();
      const reflection = {
        $set: {
          "metadata.key": generateKeyHash(`${id}`),
          "metadata.validityTime": date.setDate(date.getDate() + 24),
          updatedBy,
          isLinkOpened: false,
        },
      };

      const options = {
        upsert: false,
        returnOriginal: false,
      };

      const updatedUser = await userModel
        .findByIdAndUpdate(user._id, reflection, options)
        .lean();
      if (updatedUser) {
        const trigger: MessageTemplateDTO = await messageTemplatesModel
          .findOne({ templateName: "email_verification", isActive: true })
          .select("_id");

        if (trigger) {
          sendEmail.userVerificationEmail(updatedUser, trigger._id);
        }
      }

      return {
        data: true,
        message: "Email Sent Successfully",
      };
    } catch (error) {
      logger?.error("sendVerificationEmail - Error: ", error);
    }
  }

  async getUserById(id) {
    try {
      let filter = {
        _id: new ObjectId(String(id)),
      };

      let data = await this.findOneUser(filter, userProjectionFields);
      if (!data) {
        throw ER_USER_NOT_FOUND;
      }
      return {
        data,
        message: "User found without a password set.",
      };
    } catch (error) {
      logger?.error("getUserById - Error: ", error);
    }
  }

  async linkExpired(id) {
    const filter = {
      "metadata.key": id,
      isDeleted: false,
    };
    const check = await userModel.findOne(filter, { metadata: 1 }).lean();
    if (!check) {
      throw ER_LINK_EXPIRED;
    } else if (
      new Date(check.metadata?.validityTime).getTime() < new Date().getTime()
    ) {
      throw ER_KEY_EXPIRED;
    }
    return {
      data: id,
    };
  }

  async importCSV(files) {
    try {
      const file = files[0];
      const results = await parseCSV(file.buffer);
  
      // Initialize arrays to store categorized data
      const errorData = [];
      const successData = [];
      const duplicateData = [];
  
      // Add line numbers to results
      results.forEach((e, index) => e.lineNo = index + 1);
  
      // Process each entry
      for (const e of results) {
        const { identifyData, errorMessages } = await this.validateEntry(e);
        if (identifyData) {
          const duplicateEntry = await this.findDuplicate(e);
          if (duplicateEntry) {
            duplicateData.push(duplicateEntry);
          } else {
            successData.push({ ...e, countryCode: await this.extractCountryCode(e) });
          }
        } else {
          errorData.push({ ...e, errors: errorMessages });
        }
      }
  
      // Insert successful entries into the database
      let data = [];
      if (successData.length > 0) {
        data = await userModel.insertMany(successData);
      }
  
      // Prepare and return response
      return {
        message: "Csv added",
        data: {
          successData: data,
          errorData,
          duplicateData,
        },
      };
    } catch (error) {
      console.error("importCSV - Error:", error);
      throw error;
    }
  }
  
  // Helper function to validate an entry
  async validateEntry(entry) {
    const errorMessages = [];
    const { firstName, lastName, contact, emailId } = entry;
    let identifyData = true;
  
    if (!firstName) errorMessages.push("Missing firstName");
    if (!lastName) errorMessages.push("Missing lastName");
    if (!contact) {
      errorMessages.push("Missing contact");
      identifyData = false;
    } else {
      if (contact.startsWith("+91")) {
        entry.contact = contact.slice(3);
      }
      if (entry.contact.length !== 10) {
        errorMessages.push("Contact number should be 10 digits long");
        identifyData = false;
      }
    }
    
    if (!emailId) {
      errorMessages.push("Missing emailId");
      identifyData = false;
    } else if (!await this.isValidEmail(emailId)) {
      errorMessages.push("Invalid emailId");
      identifyData = false;
    }
  
    return { identifyData, errorMessages };
  }
  
  // Helper function to validate email format
  async isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return await re.test(email);
  }
  
  // Helper function to find duplicates in the database
  async findDuplicate(entry) {
    return await userModel.findOne({ contact: entry.contact, emailId: entry.emailId }).lean();
  }
  
  // Helper function to extract country code
  async extractCountryCode(entry) {
    return await entry.contact.startsWith("+91") ? "+91" : "";
  }

}
