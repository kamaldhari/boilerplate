import { IsEmail } from "class-validator";

export class ForgetPwdDto {
  @IsEmail()
  email: string;
}
