import mongoose from "mongoose";
import { BLOG_CATEGORIES, USERS } from "constants/mongooseTable.constants";
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;

const BlogCategoriesSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const blogCategoriesModel = mongoose.model(
  BLOG_CATEGORIES,
  BlogCategoriesSchema,
);
