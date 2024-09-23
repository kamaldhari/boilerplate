import mongoose from "mongoose";
import {
  BLOG,
  BLOG_CATEGORIES,
  USERS,
} from "constants/mongooseTable.constants";
const { Schema } = mongoose;
const { ObjectId } = Schema.Types;
const BlogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    featuredImage: [{ type: String, default: "" }],
    customImage: [{ type: String, default: "" }],
    excerpt: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: ObjectId,
      ref: BLOG_CATEGORIES,
      default: null,
    },
    publishDate: { type: String },
    blogStatus: { type: String, enum: ["draft", "publish"] },
    slug: {
      type: String,
      default: "",
    },
    createdBy: {
      type: ObjectId,
      ref: USERS,
      default: null,
    },
    modifiedBy: {
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

export const blogModel = mongoose.model(BLOG, BlogSchema);
