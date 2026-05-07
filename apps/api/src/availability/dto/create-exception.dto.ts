import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { ExceptionType } from "@prisma/client";

export class CreateExceptionDto {
  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsEnum(ExceptionType)
  type!: ExceptionType;

  @IsOptional()
  @IsString()
  reason?: string;
}
