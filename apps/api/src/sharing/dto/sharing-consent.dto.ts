import { IsOptional, IsString, MaxLength } from "class-validator";

export class ExcludeConsultationDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare reason?: string;
}
