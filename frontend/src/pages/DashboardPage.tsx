import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApplicationReview } from "../api/review";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";
import type { ApplicationReview } from "../types/onboarding";
import { AppShell } from "../components/layout/AppShell";

/**
 * BACKEND GAP #1: there is no endpoint to look up an applicant by userId.
 * This page can therefore only show the dashboard if applicantId is
 * already present in the current session's OnboardingContext (i.e. the
 * user created/continued an application earlier in this same session).
 * A user who logs in fresh, without that in-memory state, cannot reach
 * their application here yet — that requires the missing backend endpoint.
 */
export function DashboardPage() {
  const { applicantId } = useOnboarding();
  const [review, setReview] = useState<ApplicationReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (applicantId === null) return;
    setIsLoading(true);
    getApplicationReview(applicantId)
      .then(setReview)
      .catch((err) => {
        if (err instanceof ApiError || err instanceof NetworkError) {
          setError(err.message);
        } else {
          setError("Could not load your application.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [applicantId]);

  if (applicantId === null) {
    return (
      <AppShell>
        <div className="content-card">
          <h2 className="content-card__title">Applicant Dashboard</h2>
          <div className="alert alert-info">
            <p style={{ margin: 0 }}>
              We don't have an application on file for this session yet. If you already started an
              application earlier, this is a known limitation (the backend doesn't yet support looking up
              an application by account) — please continue from where you left off in the same session, or{" "}
              <Link to="/apply/personal">start a new application</Link>.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isLoading) return <AppShell><div className="content-card"><p>Loading your application…</p></div></AppShell>;
  if (error) return <AppShell><div className="content-card"><p className="form-error" role="alert">{error}</p></div></AppShell>;
  if (!review) return null;

  return (
    <AppShell>
      <div className="content-card">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-3)" }}>
          <h2 className="content-card__title">Applicant Dashboard</h2>
          <span className="badge badge-draft">Draft</span>
        </div>
        <p className="field-hint" style={{ marginTop: 0, marginBottom: "var(--space-6)" }}>
          The backend does not yet support a submitted/final status — this will always read "Draft"
          until that endpoint exists.
        </p>

        <dl>
          <div className="review-row">
            <dt>Name</dt>
            <dd>{review.personal.full_name}</dd>
          </div>
          <div className="review-row">
            <dt>Education</dt>
            <dd>{review.education?.educational_background ?? "Not saved yet"}</dd>
          </div>
          <div className="review-row">
            <dt>Test Dates</dt>
            <dd>
              {review.test_dates.length > 0
                ? review.test_dates.map((td) => td.test_name).join(", ")
                : "Not selected yet"}
            </dd>
          </div>
          <div className="review-row">
            <dt>Preferences</dt>
            <dd>
              {review.test_dates.some((td) => td.city_preferences.length > 0)
                ? review.test_dates
                    .map((td) => `${td.test_name}: ${td.city_preferences.map((p) => p.city).join(", ")}`)
                    .join(" | ")
                : "None saved yet"}
            </dd>
          </div>
          <div className="review-row">
            <dt>Documents</dt>
            <dd>{review.documents.length > 0 ? `${review.documents.length} uploaded` : "None uploaded yet"}</dd>
          </div>
        </dl>
      </div>
    </AppShell>
  );
}