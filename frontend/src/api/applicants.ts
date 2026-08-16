import { apiRequest } from "./client";
import type { Applicant, CreateApplicantRequest, UpdateApplicantRequest } from "../types/onboarding";

/**
 * POST /applicants — first save only.
 */
export async function createApplicant(payload: CreateApplicantRequest): Promise<Applicant> {
  return apiRequest<Applicant>("/applicants", {
    method: "POST",
    body: payload, // raw object — apiRequest is the only place that stringifies
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

export async function submitApplicant(applicantId: number): Promise<Applicant> {
  return apiRequest<Applicant>(`/applicants/${applicantId}/submit`, {
    method: "POST",
  });
}