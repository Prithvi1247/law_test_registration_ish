const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^\d{7,15}$/;

export interface RegisterFormValues {
  email: string;
  mobile_number: string;
  password: string;
  confirm_password: string;
}

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.mobile_number.trim()) {
    errors.mobile_number = "Mobile number is required.";
  } else if (!MOBILE_RE.test(values.mobile_number.trim())) {
    errors.mobile_number = "Enter a valid mobile number (digits only, 7–15 digits).";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!values.confirm_password) {
    errors.confirm_password = "Please confirm your password.";
  } else if (values.confirm_password !== values.password) {
    errors.confirm_password = "Passwords do not match.";
  }

  return errors;
}

export interface LoginFormValues {
  identifier: string;
  password: string;
}

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!values.identifier.trim()) {
    errors.identifier = "Enter your email or mobile number.";
  }

  if (!values.password) {
    errors.password = "Password is required.";
  }

  return errors;
}

export function isValid(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).every((v) => !v);
}
