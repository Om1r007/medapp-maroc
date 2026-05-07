import { IsBoolean, IsInt, IsOptional, Min } from "class-validator";

export class SetOverrideDto {
  @IsBoolean()
  isAvailable!: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}
