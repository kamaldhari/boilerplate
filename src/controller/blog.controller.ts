import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Req,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { AnyFilesInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import { isArray } from "class-validator";
import { ER_BAD_REQUEST } from "constants/errorMessages.constants";
import { BlogDTO, CategoriesDTO } from "dto/blog/blog.dto";
import { S3FileUploadService } from "helpers/fileHandler";
import { BlogService } from "service/blog.service";
import logger from "utils/logger";
@ApiTags("BlogController")
@Controller("blog")
export class BlogController {
  constructor(
    private readonly blogServices: BlogService,
    private readonly s3FileUploadService: S3FileUploadService,
  ) {}

  /**
   * Blog
   * @param body
   * @param req
   * @returns
   */
  @Post("/add")
  @UseInterceptors(AnyFilesInterceptor())
  async blogAdd(
    @Req() req: any,
    @Body() blogDto: BlogDTO,
    @UploadedFiles() files: any[],
  ) {
    try {
      blogDto.createdBy = req.userId;
      blogDto.updatedBy = req.userId;
      // Featured Images
      let uploadedFeaturedImage = [];
      const featuredImage = files.filter(
        (e) => e.fieldname === "featuredImage",
      );
      if (featuredImage && featuredImage.length > 0) {
        uploadedFeaturedImage = await this.s3FileUploadService.uploadFile(
          featuredImage,
          req.originalUrl,
        );
      }
      blogDto.featuredImage =
        uploadedFeaturedImage && uploadedFeaturedImage.length > 0
          ? uploadedFeaturedImage.map((e) => e.key)
          : [];
      // Custom Images
      let uploadedCustomImage = [];
      const customImage = files.filter((e) => e.fieldname === "customImage");
      if (customImage && customImage.length > 0) {
        uploadedCustomImage = await this.s3FileUploadService.uploadFile(
          customImage,
          req.originalUrl,
        );
      }
      blogDto.customImage =
        uploadedCustomImage && uploadedCustomImage.length > 0
          ? uploadedCustomImage.map((e) => e.key)
          : [];
      const response = await this.blogServices.blogAdd(blogDto);
      return response;
    } catch (error) {
      logger?.error("blogAdd - Error: ", error);
    }
  }

  @Put("/list")
  async blogList(@Req() req: any, @Body() body: any) {
    try {
      return await this.blogServices.blogList(body);
    } catch (error) {
      logger?.error("blogList - Error: ", error);
    }
  }

  @Put("/update/:id")
  @UseInterceptors(AnyFilesInterceptor())
  async blogUpdate(
    @Req() req: any,
    @Body() blogDto: BlogDTO,
    @UploadedFiles() files: any[],
  ) {
    try {
      blogDto.createdBy = blogDto.updatedBy = blogDto.modifiedBy = req.userId;
      // Featured Image
      let uploadedFeaturedImage = [];
      const featuredImage = files.filter(
        (e) => e.fieldname === "featuredImage",
      );
      if (featuredImage?.length > 0) {
        uploadedFeaturedImage = await this.s3FileUploadService.uploadFile(
          featuredImage,
          req.originalUrl,
        );
      }
      const uploadFI =
        uploadedFeaturedImage?.length > 0
          ? uploadedFeaturedImage.map((e) => e.key)
          : [];
      if (blogDto?.featuredImage && isArray(blogDto.featuredImage)) {
        blogDto.featuredImage = [blogDto.featuredImage, ...uploadFI];
      } else {
        blogDto.featuredImage = uploadFI;
      }
      let uploadedCustomImage = [];
      const customImage = files.filter((e) => e.fieldname === "customImage");
      if (customImage && customImage.length > 0) {
        uploadedCustomImage = await this.s3FileUploadService.uploadFile(
          customImage,
          req.originalUrl,
        );
      }
      const uploadCI =
        uploadedCustomImage?.length > 0
          ? uploadedCustomImage.map((e) => e.key)
          : [];
      if (blogDto?.customImage && isArray(blogDto.customImage)) {
        blogDto.customImage = [blogDto.customImage, ...uploadCI];
      } else {
        blogDto.customImage = uploadCI;
      }
      blogDto._id = req.params.id;
      return await this.blogServices.blogUpdate(blogDto);
    } catch (error) {
      logger?.error("blogUpdate - Error: ", error);
    }
  }

  @Delete("/delete/:id")
  async blogDelete(@Req() req: any, @Body() blogDto: BlogDTO) {
    try {
      blogDto.createdBy = req.userId;
      blogDto.updatedBy = req.userId;
      blogDto._id = req.params.id;
      if (req.params.id === "undefined") {
        throw ER_BAD_REQUEST;
      }
      return await this.blogServices.blogDelete(blogDto);
    } catch (error) {
      logger?.error("blogDelete - Error: ", error);
    }
  }
  @Post("/categories/add")
  async blogCategoriesInsert(
    @Req() req: any,
    @Body() categoriesDTO: CategoriesDTO,
  ) {
    try {
      categoriesDTO.updatedBy = req.userId;
      categoriesDTO.createdBy = req.userId;
      return await this.blogServices.blogCategoriesInsert(categoriesDTO);
    } catch (error) {
      logger?.error("blogCategoriesInsert - Error: ", error);
    }
  }

  /**
   * List blog categories
   * @param req
   * @param CategoriesDTO
   * @returns
   */
  @Put("/categories/list")
  async blogCategoriesList(@Req() req: any, @Body() body: any) {
    try {
      return await this.blogServices.blogCategoriesList(body);
    } catch (error) {
      logger?.error("blogCategoriesList - Error: ", error);
    }
  }

  @Put("/categories/update/:id")
  async blogCategoriesUpdate(
    @Req() req: any,
    @Body() categoriesDTO: CategoriesDTO,
  ) {
    try {
      categoriesDTO.updatedBy = req.userId;
      categoriesDTO.createdBy = req.userId;
      categoriesDTO._id = req.params.id;
      if (req.params.id === "undefined") {
        throw ER_BAD_REQUEST;
      }
      return await this.blogServices.blogCategoriesUpdate(categoriesDTO);
    } catch (error) {
      logger?.error("blogAdd - Error: ", error);
    }
  }

  @Delete("/categories/delete/:id")
  async blogCategoriesDelete(
    @Req() req: any,
    @Body() categoriesDTO: CategoriesDTO,
  ) {
    try {
      categoriesDTO.updatedBy = req.userId;
      categoriesDTO.createdBy = req.userId;
      categoriesDTO._id = req.params.id;
      if (req.params.id === "undefined") {
        throw ER_BAD_REQUEST;
      }
      return await this.blogServices.blogCategoriesDelete(categoriesDTO);
    } catch (error) {
      logger?.error("blogCategoriesDelete - Error: ", error);
    }
  }

  @Put("/user-list")
  async blogUserList() {
    try {
      return await this.blogServices.blogUserList();
    } catch (error) {
      logger?.error("blogUserList - Error: ", error);
    }
  }

  @Get("category/:category")
  async blogSingleCategoryList(@Req() req: any) {
    try {
      return await this.blogServices.blogSingleCategoryList(req.params);
    } catch (error) {
      logger?.error("blogSingleCategoryList - Error: ", error);
    }
  }

  @Get("/:slug")
  async blogSingleList(@Req() req: any) {
    try {
      return await this.blogServices.blogSingleList(req.params);
    } catch (error) {
      logger?.error("blogSingleList - Error: ", error);
    }
  }
}
