import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const DURATION_VALUES = [
  "less24h",
  "1to3d",
  "4to7d",
  "1to2w",
  "more2w",
  "chronic",
] as const;

const MODE_VALUES = ["STANDARD", "EXPRESS", "URGENT"] as const;

export class PreConsultDto {
  @IsString()
  @MaxLength(200)
  declare mainSymptom: string;

  @IsBoolean()
  declare isCustomSymptom: boolean;

  @IsOptional()
  @IsIn(DURATION_VALUES)
  duration?: (typeof DURATION_VALUES)[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  painLevel?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  additionalInfo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  urgentNote?: string;

  @IsIn(MODE_VALUES)
  declare mode: (typeof MODE_VALUES)[number];
}
