import type { PersonalDetails } from "../types/onboarding";

export type PersonalDetailsErrors = Partial<Record<keyof PersonalDetails, string>>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Deliberately permissive: this only checks "plausible", real verification
// is deferred to the future OTP step (out of scope here).
const MOBILE_RE = /^\d{7,15}$/;

function isFutureDate(isoDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const parsed = new Date(`${isoDate}T00:00:00`);
  return parsed.getTime() > today.getTime();
}

/**
 * Validates the full Personal Details form. Returns an errors object;
 * an empty object means the form is valid and safe to submit.
 */
export function validatePersonalDetails(values: PersonalDetails): PersonalDetailsErrors {
  const errors: PersonalDetailsErrors = {};

  if (!values.full_name.trim()) {
    errors.full_name = "Full name is required.";
  }

  if (!values.date_of_birth) {
    errors.date_of_birth = "Date of birth is required.";
  } else if (!DATE_RE.test(values.date_of_birth)) {
    errors.date_of_birth = "Enter a valid date.";
  } else if (Number.isNaN(new Date(values.date_of_birth).getTime())) {
    errors.date_of_birth = "Enter a valid date.";
  } else if (isFutureDate(values.date_of_birth)) {
    errors.date_of_birth = "Date of birth cannot be in the future.";
  }

  if (!values.nationality.trim()) {
    errors.nationality = "Nationality is required.";
  }

  if (values.is_nri === null) {
    errors.is_nri = "Please select your NRI status.";
  }

  if (!values.country_code.trim()) {
    errors.country_code = "Country code is required.";
  }

  if (!values.mobile_number.trim()) {
    errors.mobile_number = "Mobile number is required.";
  } else if (!MOBILE_RE.test(values.mobile_number.trim())) {
    errors.mobile_number = "Enter a valid mobile number (digits only, 7–15 digits).";
  }

  if (!values.category.trim()) {
    errors.category = "Category is required.";
  }

  return errors;
}

export function isValid(errors: PersonalDetailsErrors): boolean {
  return Object.keys(errors).length === 0;
}