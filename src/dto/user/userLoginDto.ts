import { IsEmail, IsString, Matches } from "class-validator";

export class UserLogin {
  @IsEmail()
  emailId: string;

  @IsString()
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  )
  password: string;
  data: string;
  userActivity: any;
}
