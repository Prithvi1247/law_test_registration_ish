import { apiRequest } from "./client";
import type { TestSelectionRequest } from "../types/onboarding";

/**
 * POST /applicants/{applicant_id}/test-selection
 * Backend returns an untyped {"message": "..."} ack, no response_model.
 *
 * NOTE (backend gap #5 from the architecture review): the backend does not
 * replace previously-saved preferences for the same test date — calling
 * this twice inserts duplicate rows. The frontend cannot work around this
 * without inventing behavior, so this call should only be made once per
 * test date until the backend adds replace/update semantics.
 */
export async function saveTestSelection(
  applicantId: number,
  payload: TestSelectionRequest
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/applicants/${applicantId}/test-selection`, {
    method: "POST",
    body: payload,
  });
}

/**
 * DELETE /applicants/{applicant_id}/test-selection/{test_date_id}
 * Used when the applicant deselects a previously-chosen test date.
 */
export async function deleteTestSelection(applicantId: number, testDateId: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/applicants/${applicantId}/test-selection/${testDateId}`, {
    method: "DELETE",
  });
}