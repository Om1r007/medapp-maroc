import {
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export const SEX_VALUES = ["M", "F", "OTHER"] as const;
export type SexType = (typeof SEX_VALUES)[number];

export class UpdatePatientProfileDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsIn(SEX_VALUES)
  sex?: SexType;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
