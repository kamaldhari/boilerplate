import { Injectable } from "@nestjs/common";
import * as AWS from "aws-sdk";
import { CONFIG } from "config";
import { getPath } from "./uploadPaths";
import { generateRandomSalt } from "helpers/encrypto";
import logger from "utils/logger";

AWS.config.update({
  secretAccessKey: CONFIG.s3BucketConfig.secretAccessKey,
  accessKeyId: CONFIG.s3BucketConfig.accessKeyId,
});

const spacesEndpoint = new AWS.Endpoint(
  `${CONFIG.s3BucketConfig.baseUrl}${CONFIG.s3BucketConfig.bucket}`,
);

const s3: any = new AWS.S3({
  endpoint: spacesEndpoint,
});

@Injectable()
export class S3FileUploadService {
  async uploadFile(files: any, originalUrl) {
    let uploadPromises;
    if (Array.isArray(files) && files.length > 0) {
      uploadPromises = files?.map(async (file) => {
        const { fieldname } = file;
        const uploadFile = file;

        const date: string = new Date().getTime().toString();
        const extensionMap = {
          "image/png": "png",
          "image/jpg": "jpg",
          "image/jpeg": "jpeg",
          "application/pdf": "pdf",
          "audio/mpeg": "mp3",
          "video/mp4": "mp4",
          "video/x-matroska": "mkv",
        };
        const fileExtension = extensionMap[uploadFile.mimetype] || "";
        return await s3
          .upload({
            Bucket: CONFIG.s3BucketConfig.bucket,
            Key: this.getKeyname(originalUrl, `${date}.${fileExtension}`),
            name: fieldname,
            Body: uploadFile.buffer,
            ACL: "public-read",
            ContentType: uploadFile.mimetype,
          })
          .promise();
      });
    }

    try {
      const responses = await Promise.all(uploadPromises);
      return responses;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async s3_upload(file, bucket, name, mimetype, originalUrl) {
    const params = {
      Bucket: bucket,
      Key: this.getKeyname(originalUrl, name),
      Body: file,
      ACL: "public-read",
      ContentType: mimetype,
    };

    try {
      const s3Response = await s3.upload(params).promise();
      return s3Response;
    } catch (e) {
      logger.error(e);
    }
  }

  getKeyname(originalUrl: string, originalname: string) {
    return `${getPath(
      originalUrl,
    )}${Date.now()}-${generateRandomSalt()}-${originalname}`;
  }

  deleteFile = (files) => {
    if (files) {
      (files.constructor === Array ? [...files] : [files]).forEach((file) => {
        s3.deleteObject(
          {
            Bucket: CONFIG.s3BucketConfig.bucket,
            Key: file.constructor === String ? file : file.key,
          },
          () => {},
        );
      });
    }
  };
}
