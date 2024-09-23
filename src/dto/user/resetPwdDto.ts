import { IsString } from "class-validator";

export class ResetPwdDto {
  @IsString()
  key: string;

  @IsString()
  password: string;
}
