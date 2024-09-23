import { IsString, IsUUID } from "class-validator";

export class CategoriesDTO {
  @IsUUID()
  _id: string;

  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  updatedBy: { admin: any; user: any };
  createdBy: { admin: any; user: any };
}
export class BlogDTO {
  @IsUUID()
  _id: string;

  @IsString()
  title: string;

  @IsString()
  featuredImage: string[];

  @IsString()
  customImage: string[];

  @IsString()
  description: string;

  @IsString()
  excerpt: string;

  @IsString()
  category: string;

  @IsString()
  publishDate: string;

  @IsString()
  blogStatus: string;

  @IsString()
  updatedBy: { admin: any; user: any };
  createdBy: { admin: any; user: any };
  modifiedBy: { admin: any; user: any };

  @IsString()
  createdAt: string;

  @IsString()
  updatedAt: string;
}
