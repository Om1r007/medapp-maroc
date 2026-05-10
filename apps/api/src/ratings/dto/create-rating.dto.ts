import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export const RATING_TAGS = [
  "Professionnel",
  "À l'écoute",
  "Diagnostic clair",
  "Patient",
  "Disponible",
  "Empathique",
  "Pédagogue",
] as const;

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  declare stars: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
