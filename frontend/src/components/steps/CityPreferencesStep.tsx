import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTestCentres } from "../../api/testCentres";
import { saveTestSelection } from "../../api/testSelection";
import { getApplicationReview } from "../../api/review";
import { getTestDates } from "../../api/testDates";
import { ApiError, NetworkError } from "../../api/client";
import { useOnboarding } from "../../state/OnboardingContext";
import { validateTestSelection } from "../../validation/testSelection";
import type { TestCentre, TestDate } from "../../types/onboarding";
import "./steps.css";

const RANKS = [1, 2, 3] as const;

// Per-test-date form state: state + centre chosen for each rank.
interface DateFormState {
  stateByRank: Record<number, string>;
  centreByRank: Record<number, number>;
}

export function CityPreferencesStep() {
  const navigate = useNavigate();
  const { applicantId, testDateIds } = useOnboarding();

  const [allCentres, setAllCentres] = useState<TestCentre[]>([]);
  const [testDates, setTestDates] = useState<TestDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Keyed by test_date_id.
  const [formByDate, setFormByDate] = useState<Record<number, DateFormState>>({});

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [centres, dates] = await Promise.all([getTestCentres(), getTestDates()]);
        setAllCentres(centres);
        setTestDates(dates);

        const initialForm: Record<number, DateFormState> = {};
        for (const id of testDateIds) {
          initialForm[id] = { stateByRank: {}, centreByRank: {} };
        }

        // Edit mode: prefill each date's preferences from the current DB
        // state so Review → Edit shows what's actually saved.
        if (applicantId !== null) {
          const review = await getApplicationReview(applicantId);
          for (const td of review.test_dates) {
            if (!testDateIds.includes(td.id)) continue;
            const stateByRank: Record<number, string> = {};
            const centreByRank: Record<number, number> = {};
            for (const pref of td.city_preferences) {
              const centre = centres.find((c) => c.city === pref.city && c.state === pref.state);
              if (centre) {
                stateByRank[pref.preference_rank] = pref.state ?? "";
                centreByRank[pref.preference_rank] = centre.id;
              }
            }
            initialForm[td.id] = { stateByRank, centreByRank };
          }
        }

        setFormByDate(initialForm);
      } catch (err) {
        if (err instanceof ApiError || err instanceof NetworkError) {
          setLoadError(err.message);
        } else {
          setLoadError("Could not load test centres.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId, testDateIds]);

  const states = useMemo(
    () => Array.from(new Set(allCentres.map((c) => c.state).filter((s): s is string => Boolean(s)))).sort(),
    [allCentres]
  );

  function citiesForState(state: string | undefined): TestCentre[] {
    if (!state) return [];
    return allCentres.filter((c) => c.state === state);
  }

  function updateRank(dateId: number, rank: number, field: "state" | "centre", value: string | number) {
    setFormByDate((prev) => {
      const current = prev[dateId] ?? { stateByRank: {}, centreByRank: {} };
      if (field === "state") {
        const nextCentre = { ...current.centreByRank };
        delete nextCentre[rank];
        return {
          ...prev,
          [dateId]: {
            stateByRank: { ...current.stateByRank, [rank]: value as string },
            centreByRank: nextCentre,
          },
        };
      }
      return {
        ...prev,
        [dateId]: {
          ...current,
          centreByRank: { ...current.centreByRank, [rank]: value as number },
        },
      };
    });
  }

  async function handleSubmit() {
    setFormError(null);

    if (applicantId === null) {
      setFormError("Please complete Personal Details first.");
      return;
    }
    if (testDateIds.length === 0) {
      setFormError("Please select at least one test date first.");
      navigate("/apply/test");
      return;
    }

    // Validate every date's preferences before saving any of them.
    for (const dateId of testDateIds) {
      const form = formByDate[dateId] ?? { stateByRank: {}, centreByRank: {} };
      const preferences = RANKS.map((rank) => ({
        test_centre_id: form.centreByRank[rank] ?? 0,
        preference_rank: rank,
      })).filter((p) => p.test_centre_id !== 0);

      const validationErrors = validateTestSelection(dateId, preferences);
      if (validationErrors.preferences || validationErrors.test_date_id) {
        const dateName = testDates.find((td) => td.id === dateId)?.test_name ?? `Test date ${dateId}`;
        setFormError(`${dateName}: ${validationErrors.preferences ?? validationErrors.test_date_id}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Each test date's preferences are independent — saving one never
      // touches another's rows (backend upserts scoped to applicant+date).
      for (const dateId of testDateIds) {
        const form = formByDate[dateId] ?? { stateByRank: {}, centreByRank: {} };
        const preferences = RANKS.map((rank) => ({
          test_centre_id: form.centreByRank[rank] ?? 0,
          preference_rank: rank as 1 | 2 | 3,
        })).filter((p) => p.test_centre_id !== 0);

        await saveTestSelection(applicantId, {
          test_date_id: dateId,
          city_preferences: preferences,
        });
      }
      navigate("/apply/documents");
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setFormError(err.message);
      } else {
        setFormError("Something went wrong while saving your preferences.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <div className="content-card"><p>Loading test centres…</p></div>;
  if (loadError) return <div className="content-card"><p className="form-error" role="alert">{loadError}</p></div>;
  if (testDateIds.length === 0) {
    return <div className="content-card"><p className="form-error" role="alert">Please select a test date first.</p></div>;
  }

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Application · Step 4 of 6</p>
      <h2 className="content-card__title">Test Centre Preferences</h2>
      <p className="content-card__description">
        Choose up to three preferred cities, ranked in order, for each selected test date.
      </p>

      {testDateIds.map((dateId) => {
        const testDate = testDates.find((td) => td.id === dateId);
        const form = formByDate[dateId] ?? { stateByRank: {}, centreByRank: {} };

        return (
          <section key={dateId} className="preference-set">
            <h3>{testDate ? `${testDate.test_name} — ${testDate.test_date}` : `Test date ${dateId}`}</h3>

            {RANKS.map((rank) => {
              const state = form.stateByRank[rank];
              const cities = citiesForState(state);
              return (
                <div key={rank} className="preference-row">
                  <span className="preference-row__rank">{rank}</span>
                  <div className="preference-row__fields">
                    <div className="field field-grow">
                      <label htmlFor={`state-${dateId}-${rank}`}>Preference {rank} — State</label>
                      <select
                        id={`state-${dateId}-${rank}`}
                        value={state ?? ""}
                        onChange={(e) => updateRank(dateId, rank, "state", e.target.value)}
                      >
                        <option value="">{rank === 1 ? "Select a state" : "Select a state (optional)"}</option>
                        {states.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="field field-grow">
                      <label htmlFor={`city-${dateId}-${rank}`}>Preference {rank} — City</label>
                      <select
                        id={`city-${dateId}-${rank}`}
                        value={form.centreByRank[rank] ?? ""}
                        disabled={!state}
                        onChange={(e) => updateRank(dateId, rank, "centre", Number(e.target.value))}
                      >
                        <option value="">Select a city</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      {formError && <p className="form-error" role="alert">{formError}</p>}

      <div className="step-actions">
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}