import { apiRequest } from "./client";
import type { Applicant, CreateApplicantRequest, UpdateApplicantRequest } from "../types/onboarding";

/**
 * POST /applicants — first save only.
 */
export async function createApplicant(payload: CreateApplicantRequest): Promise<Applicant> {
  return apiRequest<Applicant>("/applicants", {
    method: "POST",
    body: payload,
  });
}

/**
 * PATCH /applicants/{id} — subsequent edits. Never sends user_id.
 */
export async function updateApplicant(applicantId: number, payload: UpdateApplicantRequest): Promise<Applicant> {
  return apiRequest<Applicant>(`/applicants/${applicantId}`, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * POST /applicants/{id}/submit — final submission. On incomplete-application
 * failure (400), the backend's detail body is { message, missing: string[] }
 * — read it off ApiError.body, don't guess/hardcode a missing-fields list.
 */
export async function submitApplicant(applicantId: number): Promise<Applicant> {
  return apiRequest<Applicant>(`/applicants/${applicantId}/submit`, {
    method: "POST",
  });
}

/**
 * GET /users/{user_id}/applicant — used after login to recover an
 * existing draft/submitted application. Throws ApiError with status 404
 * (caught by the caller) when the user has no applicant yet.
 */
export async function getApplicantByUserId(userId: number): Promise<Applicant> {
  return apiRequest<Applicant>(`/users/${userId}/applicant`);
}