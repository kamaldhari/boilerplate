import { IsString } from "class-validator";

export class SetPwdDto {
  @IsString()
  key: string;

  @IsString()
  password: string;
}
