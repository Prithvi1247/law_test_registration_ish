import { apiRequest } from "./client";
import type { Applicant, CreateApplicantRequest } from "../types/onboarding";

/**
 * POST /applicants
 * Creates (or, conceptually, "registers") the applicant record for the
 * current user and returns the created applicant, including its id.
 *
 * This is the ONLY backend write this task integrates with.
 */
export async function createApplicant(payload: CreateApplicantRequest): Promise<Applicant> {
  return apiRequest<Applicant>("/applicants", {
    method: "POST",
    body: payload,
  });
}