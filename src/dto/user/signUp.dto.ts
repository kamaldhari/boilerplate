import {
  IsString,
  IsEmail,
  IsPhoneNumber,
  IsNumber,
  IsObject,
} from "class-validator";

export class AddressDto {
  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsString()
  pincode: string;

  @IsString()
  latitude: string;

  @IsString()
  longitude: string;
}

export class SignUpDto {
  @IsString()
  name: string;

  @IsPhoneNumber("IN", { message: "Invalid Indian phone number" })
  contact: string;

  @IsEmail({}, { message: "Invalid email" })
  email: string;

  @IsString()
  MCINumber: string;

  @IsString()
  hospitalName: string;

  @IsNumber()
  numDoctors: number;

  @IsObject()
  streetAddress: AddressDto;
}
