import { IsEmail, IsString, IsPhoneNumber, IsIn } from "class-validator";

export class UserAdd {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsPhoneNumber("IN")
  contact: string;

  @IsString()
  countryCode: string;

  @IsString()
  roles: string;

  @IsEmail()
  emailId: string;

  @IsIn(["APPROVE", "REJECT"])
  isApproved: string;

  @IsString()
  address: string;

  @IsString()
  updatedBy: string;

  @IsString()
  createdBy: string;

  @IsString()
  data: string;
}
