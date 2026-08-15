import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTestDates } from "../../api/testDates";
import { getApplicationReview } from "../../api/review";
import { deleteTestSelection } from "../../api/testSelection";
import { ApiError, NetworkError } from "../../api/client";
import { useOnboarding } from "../../state/OnboardingContext";
import type { TestDate } from "../../types/onboarding";

export function TestDetailsStep() {
  const navigate = useNavigate();
  const { applicantId, testDateIds, setTestDateIds } = useOnboarding();

  const [testDates, setTestDates] = useState<TestDate[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set(testDateIds));
  // The set we started from when this mount loaded — needed to know which
  // dates were deselected on Continue, without re-fetching.
  const [initiallySelected, setInitiallySelected] = useState<Set<number>>(new Set(testDateIds));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const dates = await getTestDates();
        setTestDates(dates);

        // Edit mode: prefill from the current DB state, not stale context,
        // so Review → Edit always reflects what's actually saved.
        if (applicantId !== null) {
          const review = await getApplicationReview(applicantId);
          const savedIds = new Set(review.test_dates.map((td) => td.id));
          setSelected(savedIds);
          setInitiallySelected(savedIds);
          setTestDateIds(Array.from(savedIds));
        }
      } catch (err) {
        if (err instanceof ApiError || err instanceof NetworkError) {
          setError(err.message);
        } else {
          setError("Could not load test date information.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleContinue() {
    setError(null);

    if (selected.size === 0) {
      setError("Please select at least one test date.");
      return;
    }

    if (applicantId === null) {
      setError("Please complete Personal Details first.");
      return;
    }

    // Deselected = was saved before, not selected now. Delete those on the
    // backend; never touch dates that remain selected.
    const deselected = Array.from(initiallySelected).filter((id) => !selected.has(id));

    setIsSaving(true);
    try {
      for (const id of deselected) {
        await deleteTestSelection(applicantId, id);
      }
      setTestDateIds(Array.from(selected));
      navigate("/apply/preferences");
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("Something went wrong while updating your test date selection.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h2>Test Date</h2>
      <p>You may select one or both test dates.</p>

      {isLoading && <p>Loading available test dates…</p>}

      {!isLoading && testDates.length === 0 && !error && <p>No test dates are currently available.</p>}

      {!isLoading && testDates.length > 0 && (
        <fieldset className="field">
          <legend>Select test date(s)</legend>
          <div className="radio-group" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            {testDates.map((td) => (
              <label key={td.id}>
                <input type="checkbox" checked={selected.has(td.id)} onChange={() => toggle(td.id)} />
                {td.test_name} — {td.test_date}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {error && <p className="form-error">{error}</p>}

      <button type="button" onClick={handleContinue} disabled={isLoading || isSaving}>
        {isSaving ? "Saving…" : "Continue"}
      </button>
    </div>
  );
}