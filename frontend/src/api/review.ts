import { apiRequest } from "./client";
import type { ApplicationReview } from "../types/onboarding";

/**
 * GET /applicants/{applicant_id}/review
 * Safe to call mid-onboarding — education/test_date come back null until
 * those sections are saved.
 */
export async function getApplicationReview(applicantId: number): Promise<ApplicationReview> {
  return apiRequest<ApplicationReview>(`/applicants/${applicantId}/review`);
}
