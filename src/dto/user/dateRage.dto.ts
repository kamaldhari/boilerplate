import { IsDateString, IsNotEmpty } from "class-validator";

export class DateRangeDTO {
  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;
}
