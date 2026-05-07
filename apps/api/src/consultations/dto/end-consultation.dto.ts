import { IsOptional, IsString, MaxLength } from "class-validator";

export class EndConsultationDto {
  @IsString()
  @MaxLength(2000)
  diagnosis!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  prescription?: string;
}
