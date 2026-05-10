import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  Max,
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

  // Champs enrichis — optionnels à l'inscription, requis pour verificationStep PROFESSIONAL
  @IsOptional()
  @IsString()
  @MaxLength(20)
  inpe?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  diplomaUniversity?: string;

  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear())
  diplomaYear?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;
}
