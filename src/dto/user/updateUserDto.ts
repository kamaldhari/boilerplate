import { IsObject } from "class-validator";

export class UpdateUserDto {
  @IsObject()
  experienceDetailed: {
    hospitalName: string;
    hospitalAddress: {
      line1: string;
      city: string;
      state: string;
      country: string;
      pincode: string;
      latitude: string;
      longitude: string;
    };
    fromDate: Date;
    toDate?: Date;
    designation: string;
    description: string;
    _id: string;
  };
  updatedBy: string;
}
