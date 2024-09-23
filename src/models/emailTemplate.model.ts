import mongoose from "mongoose";
import { MESSAGE_TEMPLATES, USERS } from "../constants/mongooseTable.constants";
import { MESSAGE_TYPE, USER_CATEGORY_TYPE } from "../constants/app.constants";

const MESSAGE_TYPE_ENUM = Object.values(MESSAGE_TYPE);
const USER_CATEGORY_TYPE_ENUM = Object.values(USER_CATEGORY_TYPE);

const { Schema } = mongoose;

const { ObjectId } = Schema.Types;

const MessageTemplatesSchema = new Schema(
  {
    templateName: {
      type: String,
    },
    body: {
      type: Object,
    },
    subject: {
      type: String,
    },
    type: {
      type: String,
      enum: MESSAGE_TYPE_ENUM,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: USER_CATEGORY_TYPE_ENUM,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: ObjectId,
      ref: USERS,
      default: null,
    },
    updatedBy: {
      type: ObjectId,
      ref: USERS,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export const messageTemplatesModel = mongoose.model(
  MESSAGE_TEMPLATES,
  MessageTemplatesSchema,
);
