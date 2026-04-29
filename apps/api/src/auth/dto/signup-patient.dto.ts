import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsDateString,
} from "class-validator";

export class SignupPatientDto {
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

  // Format E.164 — au Maroc : +212 suivi de 9 chiffres
  @Matches(/^\+212[0-9]{9}$/, {
    message: "Numéro de téléphone invalide (format attendu : +212XXXXXXXXX)",
  })
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // CIN marocaine : 1-2 lettres + 5-6 chiffres (ex: AB123456, K456789)
  @Matches(/^[A-Z]{1,2}[0-9]{5,6}$/, {
    message: "CIN invalide (format attendu : 1-2 lettres majuscules + 5-6 chiffres)",
  })
  cin!: string;

  @IsDateString()
  dateOfBirth!: string;
}
