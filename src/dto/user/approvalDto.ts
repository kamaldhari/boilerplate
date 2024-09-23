import { IsArray, IsString, IsIn } from "class-validator";

export class UserApprovalDto {
  @IsArray()
  userIds: string[];

  @IsString()
  @IsIn(["APPROVE", "REJECT"])
  approval: string;
  updatedBy: string;
}
