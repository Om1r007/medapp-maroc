import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateConsultationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
