export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  github?: string;
  dateNaissance?: string;
  profilId: string;
  blocked?: boolean;
  loginAttempts?: number;
  lastFailedLogin?: string;
  displayName?: string;
  telephone?: string;
  disabled?: boolean;
  disabledAt?: string;
  disabledReason?: string;
  reactivatedAt?: string;
  reactivatedBy?: string;
  role?: string;
}