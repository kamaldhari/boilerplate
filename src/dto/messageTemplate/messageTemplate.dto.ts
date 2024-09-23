import { IsBoolean, IsString, IsUUID } from "class-validator";

export class MessageTemplateDTO {
  @IsUUID()
  _id: string;

  @IsString()
  templateName: string;

  @IsString()
  type: string;

  @IsUUID()
  trigger: string;

  @IsString()
  category: string;
  updatedBy: { admin: any; user: any };
  createdBy: { admin: any; user: any };
}

export class MessageTypeDTO {
  @IsString()
  type: string;
}

export class IsActiveDto {
  @IsBoolean()
  isActive: boolean;
  updatedBy: { admin: any; user: any };
}

export class ListDto {
  @IsString()
  type: string;
  updatedBy: { admin: any; user: any };
}
