import { IsInt, IsString, Matches, Max, Min } from "class-validator";

export class CreateSlotDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "startTime doit être au format HH:mm" })
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "endTime doit être au format HH:mm" })
  endTime!: string;
}
