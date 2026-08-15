import type { CityPreferenceInput } from "../types/onboarding";

export interface TestSelectionErrors {
  test_date_id?: string;
  preferences?: string;
}

/**
 * Mirrors backend validation (see main.py save_test_selection) for instant
 * feedback — the backend remains the final authority.
 */
export function validateTestSelection(
  testDateId: number | null,
  preferences: CityPreferenceInput[]
): TestSelectionErrors {
  const errors: TestSelectionErrors = {};

  if (testDateId === null) {
    errors.test_date_id = "Please select a test date.";
    return errors;
  }

  const chosen = preferences.filter((p) => p.test_centre_id !== 0);

  if (chosen.length < 1) {
    errors.preferences = "Select at least one preferred city.";
    return errors;
  }

  const centreIds = chosen.map((p) => p.test_centre_id);
  if (new Set(centreIds).size !== centreIds.length) {
    errors.preferences = "Each preference must be a different city.";
  }

  return errors;
}
