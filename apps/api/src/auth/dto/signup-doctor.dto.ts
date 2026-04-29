import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

export class SignupDoctorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsEmail()
  email!: string;

  @Matches(/^\+212[0-9]{9}$/, {
    message: "Numéro de téléphone invalide (format attendu : +212XXXXXXXXX)",
  })
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @Matches(/^[A-Z]{1,2}[0-9]{5,6}$/, {
    message: "CIN invalide",
  })
  cin!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  ordreNumber!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  speciality!: string;
}
