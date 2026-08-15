import { apiRequest } from "./client";
import type { TestCentre } from "../types/onboarding";

/**
 * GET /test-centres, optionally GET /test-centres?state=<state>
 * Backend already filters to active centres.
 */
export async function getTestCentres(state?: string): Promise<TestCentre[]> {
  const query = state ? `?state=${encodeURIComponent(state)}` : "";
  return apiRequest<TestCentre[]>(`/test-centres${query}`);
}
