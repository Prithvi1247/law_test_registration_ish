import { apiRequest } from "./client";
import type { TestDate } from "../types/onboarding";

/**
 * GET /test-dates — backend already filters to active dates.
 */
export async function getTestDates(): Promise<TestDate[]> {
  return apiRequest<TestDate[]>("/test-dates");
}
