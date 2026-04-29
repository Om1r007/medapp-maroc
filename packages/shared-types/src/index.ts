// ============================================================
// Shared types — utilisés par l'API et les frontends
// ============================================================

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export type DoctorStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export type ConsultationStatus =
  | "WAITING_PAYMENT"
  | "IN_QUEUE"
  | "MATCHED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED";

// ---------- Auth ----------
export interface SignupPatientDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // format E.164 : +212XXXXXXXXX
  password: string;
  cin: string; // Carte d'identité nationale marocaine
  dateOfBirth: string; // ISO date
}

export interface SignupDoctorDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  cin: string;
  ordreNumber: string; // N° d'inscription Ordre National des Médecins
  speciality: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

// ---------- Patient ----------
export interface Patient {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  cin: string;
  dateOfBirth: string;
  createdAt: string;
}

// ---------- Doctor ----------
export interface Doctor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cin: string;
  ordreNumber: string;
  speciality: string;
  status: DoctorStatus;
  isAvailable: boolean;
  rating?: number;
  consultationFee: number; // en MAD
  createdAt: string;
}

// ---------- Consultation ----------
export interface Consultation {
  id: string;
  patientId: string;
  doctorId?: string;
  status: ConsultationStatus;
  amount: number; // en MAD
  paymentStatus: PaymentStatus;
  reason?: string;
  diagnosis?: string;
  prescription?: string;
  videoRoomUrl?: string;
  queuedAt?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

// ---------- Queue ----------
export interface QueuePosition {
  consultationId: string;
  position: number;
  estimatedWaitMinutes: number;
}

// ---------- API Response wrappers ----------
export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}
