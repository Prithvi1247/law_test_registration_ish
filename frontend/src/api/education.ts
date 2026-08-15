import { apiRequest } from "./client";
import type { Education } from "../types/onboarding";

/**
 * POST /applicants/{applicant_id}/education
 * Note: the backend's EducationCreate schema requires applicant_id in the
 * body too, but the handler ignores it and uses the path param. We still
 * send it to satisfy validation.
 */
export async function saveEducation(applicantId: number, educationalBackground: string): Promise<Education> {
  return apiRequest<Education>(`/applicants/${applicantId}/education`, {
    method: "POST",
    body: {
      applicant_id: applicantId,
      educational_background: educationalBackground,
    },
  });
}
