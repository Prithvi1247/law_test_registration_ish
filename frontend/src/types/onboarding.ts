// Shared onboarding types.
// These mirror the backend contract exactly — do not add fields that
// aren't part of the documented API contract.

export interface PersonalDetails {
  full_name: string;
  date_of_birth: string; // stored as YYYY-MM-DD once valid, otherwise raw input
  nationality: string;
  is_nri: boolean | null; // null = not yet chosen, distinct from false
  country_code: string;
  mobile_number: string;
  category: string;
}

// The exact shape the backend returns from POST /applicants (ApplicantResponse).
export interface Applicant {
  id: number;
  user_id: number;
  registration_id: string | null;
  full_name: string;
  date_of_birth: string;
  country_code: string;
  mobile_number: string;
  category: string;
  is_nri: boolean;
  nationality: string;
  status: string; // backend sets "draft" on creation; no transition endpoint exists yet
}

// review.personal (ReviewPersonal) omits registration_id/status vs. Applicant above
export interface ReviewPersonal {
  id: number;
  full_name: string;
  date_of_birth: string;
  country_code: string;
  mobile_number: string;
  category: string;
  is_nri: boolean;
  nationality: string;
}

// Payload sent to POST /applicants
export interface CreateApplicantRequest {
  user_id: number;
  full_name: string;
  date_of_birth: string;
  country_code: string;
  mobile_number: string;
  category: string;
  is_nri: boolean;
  nationality: string;
}

// Onboarding-wide state. Only userId and applicantId are populated by
// this task; later sections will read/extend this as they're built.
export interface OnboardingState {
  userId: number | null;
  applicantId: number | null;
}

export const emptyPersonalDetails: PersonalDetails = {
  full_name: "",
  date_of_birth: "",
  nationality: "",
  is_nri: null,
  country_code: "+91",
  mobile_number: "",
  category: "",
};

// ---------------------------------------------------------------------
// Types below mirror the rest of the documented backend contract.
// They are NOT wired to any UI yet — only Section 1 (Personal Details)
// is implemented. These exist so later sections can be built against
// typed shapes instead of re-deriving them from the spec each time.
// ---------------------------------------------------------------------

// POST /applicants/{id}/education request + response shape
export interface Education {
  applicant_id: number;
  educational_background: string;
}

// GET /test-dates response item
export interface TestDate {
  id: number;
  test_name: string;
  test_date: string;
  is_active: boolean;
}

// GET /test-centres response item
export interface TestCentre {
  id: number;
  city: string;
  state: string | null;
  is_active: boolean;
}

// One entry in the city_preferences array sent to
// POST /applicants/{id}/test-selection
export interface CityPreferenceInput {
  test_centre_id: number;
  preference_rank: 1 | 2 | 3;
}

// Full payload for POST /applicants/{id}/test-selection
export interface TestSelectionRequest {
  test_date_id: number;
  city_preferences: CityPreferenceInput[];
}

// document_type is always "PHOTO" for the photo upload step described
// in this task; the backend supports other document_type values too,
// but only PHOTO is in scope so far.
export type DocumentType = "PHOTO";

// Response shape from POST /applicants/{id}/documents
export interface ApplicantDocument {
  id: number;
  applicant_id: number;
  document_type: DocumentType;
  file_url: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  uploaded_at: string;
}

// GET /applicants/{id}/review response (ReviewResponse) — education and
// test_date are nullable: the backend returns this successfully even
// mid-onboarding, before those sections have been saved.
export interface ReviewTestDate {
  id: number;
  test_name: string;
  test_date: string;
  city_preferences: Array<{
    preference_rank: number;
    city: string;
    state: string | null;
  }>;
}

export interface ApplicationReview {
  personal: ReviewPersonal;
  education: { educational_background: string } | null;
  test_dates: ReviewTestDate[];
  documents: Array<{
    document_type: DocumentType;
    original_filename: string | null;
    file_url: string;
  }>;
}

// PATCH /applicants/{id} request (ApplicantUpdate) — same fields as
// CreateApplicantRequest minus user_id, which must never change via edit.
export interface UpdateApplicantRequest {
  full_name: string;
  date_of_birth: string;
  country_code: string;
  mobile_number: string;
  category: string;
  is_nri: boolean;
  nationality: string;
}

// ---------------------------------------------------------------------
// Auth types
// ---------------------------------------------------------------------

// POST /users response (UserResponse) and POST /login response (same shape)
export interface User {
  id: number;
  email: string;
  is_verified: boolean;
}

// POST /users request (UserCreate)
export interface RegisterRequest {
  email: string;
  mobile_number: string;
  password: string;
}

// POST /login request (UserLogin) — identifier is email OR mobile_number
export interface LoginRequest {
  identifier: string;
  password: string;
}