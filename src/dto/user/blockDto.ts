import { IsArray, IsString, IsBoolean } from "class-validator";

export class UserBlockDto {
  @IsArray()
  userIds: string[];

  @IsBoolean()
  block: boolean;

  @IsString()
  updatedBy: string;
}
