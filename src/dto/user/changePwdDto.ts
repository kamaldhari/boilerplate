import { IsString } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  id: string;

  @IsString()
  oldPassword: string;

  @IsString()
  newPassword: string;
}
