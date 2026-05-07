import { IsOptional, IsString, Matches } from "class-validator";

export class UpdateSlotDto {
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "startTime doit être au format HH:mm" })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "endTime doit être au format HH:mm" })
  endTime?: string;
}
