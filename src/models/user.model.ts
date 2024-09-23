import mongoose from "mongoose";

import { USERS } from "../constants/mongooseTable.constants";

const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
    },
    middleName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    userName: {
      type: String,
    },
    role: {
      type: String,
    },
    contact: {
      type: String,
      required: true,
      unique: true,
    },
    countryCode: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    emailId: {
      type: String,
      required: true,
    },
    password: {
      hash: {
        type: String,
      },
      salt: {
        type: String,
      },
    },
    address: {
      type: String,
    },
    metadata: {
      key: {
        type: String,
        default: "",
      },
      validityTime: {
        type: Date,
        default: null,
      },
    },
    resetPassword: {
      key: {
        type: String,
        default: "",
      },
      validityTime: {
        type: Date,
        default: null,
      },
    },
    lastLoginTime: {
      type: Date,
      default: null,
    },
    tokens: [
      {
        _id: false,
        token: {
          type: String,
          default: null,
        },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: String,
      default: "0",
    },
    isActive: {
      type: Boolean,
      default: true,
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

UserSchema.index({ firstName: 1 });
UserSchema.index({ middleName: 1 });
UserSchema.index({ lastName: 1 });
UserSchema.index({ emailId: 1 });
UserSchema.index({ contact: 1 });
UserSchema.index({ isVerified: 1 });
UserSchema.index({ isApproved: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ isDeleted: 1 });

export const userModel = mongoose.model(USERS, UserSchema);
