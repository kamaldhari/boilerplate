import { blogModel } from "models/blog.model";
import { ER_CATEGORY_ALREADY_EXIST } from "constants/errorMessages.constants";
import { blogCategoriesModel } from "models/categories.model";
import { S3FileUploadService } from "helpers/fileHandler";
import { Inject, Injectable, forwardRef } from "@nestjs/common";
import logger from "utils/logger";
import { BLOG_CATEGORIES } from "constants/mongooseTable.constants";
import { blogProjectionFields } from "constants/projectionFields.constants";
@Injectable()
export class BlogService {
  /**
   * category add
   * @param body
   * @returns
   */
  constructor(
    @Inject(forwardRef(() => S3FileUploadService))
    private readonly s3FileUploadService: S3FileUploadService,
  ) {}
  async blogAdd(body) {
    try {
      function convertToSlug(text: string): string {
        return text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "") // Remove special characters
          .replace(/\s+/g, "-") // Replace spaces with hyphens
          .replace(/--+/g, "-"); // Replace multiple hyphens with a single hyphen
      }
      const bodyData = {
        ...body,
        slug: convertToSlug(body.title),
      };
      const blogData = new blogModel(bodyData);
      const record = await blogData.save();
      const data = await blogModel
        .findById(record._id)
        .populate("category", "_id name")
        .lean();
      return {
        data,
        message: "Blog Added.",
        statusCode: 201,
      };
    } catch (error) {
      logger?.error("blogAdd - Error: ", error);
    }
  }

  async blogList(body) {
    try {
      const { search, pagination } = body;
      let paginationData;
      if ((!search || search === "") && pagination !== undefined) {
        paginationData = [
          {
            $skip: (pagination.pageNo - 1) * pagination.pageSize,
          },
          {
            $limit: pagination.pageSize,
          },
        ];
      }

      const aggregateArray = [
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $lookup: {
            from: BLOG_CATEGORIES,
            foreignField: "_id",
            localField: "category",
            as: "category",
          },
        },
        {
          $project: {
            ...blogProjectionFields,
            category: {
              _id: { $arrayElemAt: ["$category._id", 0] },
              name: { $arrayElemAt: ["$category.name", 0] },
            },
          },
        },
        {
          $project: {
            ...blogProjectionFields,
            category: { $arrayElemAt: ["$category", 0] },
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...(paginationData || []),
      ];

      if (search && (search !== "" || search !== undefined)) {
        const values = search.trim().split(" ");

        let matchExpressions = [];
        if (values.length === 1) {
          matchExpressions = [
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$title",
                    regex: new RegExp(`${values[0]}`, "i"),
                  },
                },
                then: 3,
                else: 0,
              },
            },
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$excerpt",
                    regex: new RegExp(`${values[0]}`, "i"),
                  },
                },
                then: 1,
                else: 0,
              },
            },
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$description",
                    regex: new RegExp(`${values[0]}`, "i"),
                  },
                },
                then: 1,
                else: 0,
              },
            },
          ];
        } else {
          matchExpressions = [
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$title",
                    regex: new RegExp(`${search}`, "i"),
                  },
                },
                then: 1,
                else: 0,
              },
            },
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$description",
                    regex: new RegExp(`${search}`, "i"),
                  },
                },
                then: 1,
                else: 0,
              },
            },
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$excerpt",
                    regex: new RegExp(`${search}`, "i"),
                  },
                },
                then: 1,
                else: 0,
              },
            },
          ];
        }

        aggregateArray.push({
          $addFields: { searchScore: { $sum: matchExpressions } },
        });

        aggregateArray.push({
          $match: { searchScore: { $ne: 0 } },
        });

        aggregateArray.push({
          $sort: { searchScore: -1 },
        });

        if (pagination != undefined) {
          aggregateArray.push(
            {
              $skip: (pagination.pageNo - 1) * pagination.pageSize,
            },
            {
              $limit: pagination.pageSize,
            },
          );
        }
      }

      const aggregateArrayCount = aggregateArray.slice(0, -2);
      aggregateArrayCount.push({ $count: "total" });

      const [blogsCount, blogs] = await Promise.all([
        blogModel.aggregate(aggregateArrayCount),
        blogModel.aggregate(aggregateArray),
      ]);

      return {
        message: "Blog Data Listed.",
        count: blogsCount.length > 0 ? blogsCount?.[0].total : 0,
        data: blogs.length > 0 ? blogs : [],
      };
    } catch (error) {
      logger?.error("blogList - Error: ", error);
    }
  }

  async blogUpdate(body) {
    try {
      const findBlog = await blogModel.findById(body._id);
      // Feature image filters
      const featuredImagesToDelete = findBlog.featuredImage.filter(
        (findBlogImg) => {
          const isSameImg = body.featuredImage.includes(findBlogImg);
          return !isSameImg;
        },
      );
      // Delete images from s3File
      for (const img of featuredImagesToDelete) {
        // If delete image flag is found then delete existing image.
        this.s3FileUploadService.deleteFile(img);
      }
      // Custom Image filters
      const customImagesToDelete = findBlog.customImage.filter(
        (findBlogImg) => {
          const isSameImg = body.customImage.includes(findBlogImg);
          return !isSameImg;
        },
      );
      // Delete images from s3File
      for (const img of customImagesToDelete) {
        // If delete image flag is found then delete existing image.
        this.s3FileUploadService.deleteFile(img);
      }
      interface Reflection {
        $set: {
          [key: string]: any;
        };
        $unset?: {
          [key: string]: any;
        };
      }
      const newValue: Reflection = {
        $set: {
          ...body,
        },
      };
      if (
        body.category === "undefined" ||
        body.category === "null" ||
        body.category === ""
      ) {
        newValue.$unset = { category: "" }; // This will remove the category field
        delete newValue.$set.category; // Ensure the category field is not set in $set
      } else {
        newValue.$set.category = body.category;
      }

      await blogModel.updateOne({ _id: body._id }, newValue);
      const data = await blogModel
        .findById(body._id)
        .populate("category", "_id name")
        .lean();
      return {
        data,
        message: "Blog Updated Succesfully",
        statusCode: 200,
      };
    } catch (error) {
      logger?.error("blogUpdate - Error: ", error);
    }
  }

  async blogDelete(body) {
    try {
      const archivedSetToTrue = {
        $set: { isDeleted: true },
      };
      await blogModel.updateOne({ _id: body._id }, archivedSetToTrue);
      return {
        data: { _id: body._id },
        message: "Blog delete succesfully",
        statusCode: 204,
      };
    } catch (error) {
      logger?.error("blogDelete - Error: ", error);
    }
  }

  async blogCategoriesInsert(body) {
    try {
      const findDuplicateCat = await blogCategoriesModel.findOne({
        name: new RegExp(body.name, "i"),
        isDeleted: false,
      });
      if (findDuplicateCat) {
        throw ER_CATEGORY_ALREADY_EXIST;
      }
      const blogCategoriesData = new blogCategoriesModel(body);
      const record = await blogCategoriesData.save();
      const data = await blogCategoriesModel.findById(record._id).lean();
      return {
        data,
        message: "Categories Data Added.",
        statusCode: 201,
      };
    } catch (error) {
      logger?.error("blogCategoriesInsert - Error: ", error);
    }
  }

  async blogCategoriesList(body) {
    try {
      const { search, pagination } = body;
      let paginationData;
      if ((!search || search === "") && pagination !== undefined) {
        paginationData = [
          {
            $skip: (pagination.pageNo - 1) * pagination.pageSize,
          },
          {
            $limit: pagination.pageSize,
          },
        ];
      }

      const aggregateArray = [
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
        ...(paginationData || []),
      ];

      if (search && (search !== "" || search !== undefined)) {
        const values = search.trim().split(" ");

        let matchExpressions = [];
        if (values.length === 1) {
          matchExpressions = [
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$name",
                    regex: new RegExp(`${values[0]}`, "i"),
                  },
                },
                then: 3,
                else: 0,
              },
            },
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$description",
                    regex: new RegExp(`${values[0]}`, "i"),
                  },
                },
                then: 1,
                else: 0,
              },
            },
          ];
        } else {
          matchExpressions = [
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$name",
                    regex: new RegExp(`${search}`, "i"),
                  },
                },
                then: 1,
                else: 0,
              },
            },
            {
              $cond: {
                if: {
                  $regexMatch: {
                    input: "$description",
                    regex: new RegExp(`${search}`, "i"),
                  },
                },
                then: 1,
                else: 0,
              },
            },
          ];
        }

        aggregateArray.push({
          $addFields: { searchScore: { $sum: matchExpressions } },
        });

        aggregateArray.push({
          $match: { searchScore: { $ne: 0 } },
        });

        aggregateArray.push({
          $sort: { searchScore: -1 },
        });

        if (pagination != undefined) {
          aggregateArray.push(
            {
              $skip: (pagination.pageNo - 1) * pagination.pageSize,
            },
            {
              $limit: pagination.pageSize,
            },
          );
        }
      }

      const aggregateArrayCount = aggregateArray.slice(0, -2);
      aggregateArrayCount.push({ $count: "total" });

      const [blogCategoriesCount, blogCategories] = await Promise.all([
        blogCategoriesModel.aggregate(aggregateArrayCount),
        blogCategoriesModel.aggregate(aggregateArray),
      ]);

      return {
        message: "Categories Data Listed.",
        count:
          blogCategoriesCount.length > 0 ? blogCategoriesCount?.[0].total : 0,
        data: blogCategories.length > 0 ? blogCategories : [],
      };
    } catch (error) {
      logger?.error("blogCategoriesList - Error: ", error);
    }
  }

  async blogCategoriesUpdate(body) {
    try {
      const findDuplicateCat = await blogCategoriesModel.find({
        name: new RegExp(body.name, "i"),
      });
      const filterId = findDuplicateCat.filter(
        (e) => e._id.toString() !== body._id,
      );
      if (filterId.length > 0) {
        throw ER_CATEGORY_ALREADY_EXIST;
      }
      const newValue = {
        $set: { name: body.name, description: body.description },
      };
      await blogCategoriesModel.updateOne({ _id: body._id }, newValue);
      const data = await blogCategoriesModel.findById(body._id).lean();
      return {
        data,
        message: "Categorie updated.",
        statusCode: 200,
      };
    } catch (error) {
      logger?.error("blogCategoriesUpdate - Error: ", error);
    }
  }

  async blogCategoriesDelete(body) {
    try {
      const archivedSetToTrue = {
        $set: { isDeleted: true },
      };
      await blogCategoriesModel.updateOne({ _id: body._id }, archivedSetToTrue);
      await blogModel.updateMany(
        { category: body._id },
        { $unset: { category: "" } },
      );
      return {
        data: { _id: body._id },
        message: "Categorie deleted.",
        statusCode: 204,
      };
    } catch (error) {
      logger?.error("blogCategoriesDelete - Error: ", error);
    }
  }

  async blogUserList() {
    try {
      const filter = {
        isDeleted: false,
        blogStatus: "publish",
      };
      const data = await blogModel.find(filter).populate<{
        category: { _id: string; name: string };
      }>("category", "_id name");
      const categorizedData = data.reduce((acc, curr) => {
        const categoryName = curr?.category
          ? curr.category.name
          : "Uncategorized";
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push({
          _id: curr._id,
          title: curr.title,
          featuredImage: curr.featuredImage,
          category: curr.category,
          excerpt: curr.excerpt,
          publishDate: curr.publishDate,
          slug: curr.slug,
        });
        return acc;
      }, {});
      // Move the "Uncategorized" data to the end
      const uncategorizedData = categorizedData["Uncategorized"];
      delete categorizedData["Uncategorized"];
      categorizedData["Uncategorized"] = uncategorizedData;
      return {
        data: categorizedData,
        message: "Blog listed",
      };
    } catch (error) {
      logger?.error("blogUserList - Error: ", error);
    }
  }

  async blogSingleCategoryList(body) {
    try {
      const filter: { isDeleted: boolean; category?: any } = {
        isDeleted: false,
      };
      if (body.category === "uncategorized") {
        filter.category = null;
      } else if (body.category !== "all") {
        const categoryId = await blogCategoriesModel
          .findOne({ name: new RegExp(body.category, "i"), isDeleted: false })
          .lean();
        filter.category = categoryId._id;
      }
      const data = await blogModel
        .find(filter)
        .populate("category", "_id name");
      return {
        data,
        message: "Blog category data listed",
        statusCode: 200,
      };
    } catch (error) {
      logger?.error("blogSingleCategoryList - Error: ", error);
    }
  }

  async blogSingleList(body) {
    try {
      const blogData = await blogModel
        .findOne({
          slug: new RegExp(body.slug, "i"),
          isDeleted: false,
        })
        .populate("category", "_id name")
        .lean();
      return {
        data: blogData,
        message: "Blog single data",
        statusCode: 200,
      };
    } catch (error) {
      logger?.error("blogSingleList - Error: ", error);
    }
  }
}
