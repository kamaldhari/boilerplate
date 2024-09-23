import { IsArray, IsString } from "class-validator";

export class DeleteUser {
  @IsArray()
  userIds: string[];

  @IsString()
  updatedBy: string;
}
