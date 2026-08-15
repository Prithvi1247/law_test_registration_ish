import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApplicationReview } from "../api/review";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";
import type { ApplicationReview } from "../types/onboarding";

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
      <div>
        <h2>Applicant Dashboard</h2>
        <p>
          We don't have an application on file for this session yet. If you already started an
          application earlier, this is a known limitation (the backend doesn't yet support looking up
          an application by account) — please continue from where you left off in the same session, or{" "}
          <Link to="/apply/personal">start a new application</Link>.
        </p>
      </div>
    );
  }

  if (isLoading) return <p>Loading your application…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!review) return null;

  return (
    <div>
      <h2>Applicant Dashboard</h2>
      <p>
        <strong>Status:</strong> Draft
        <br />
        <span style={{ fontSize: "0.85rem", color: "#888" }}>
          (The backend does not yet support a submitted/final status — this will always read "Draft"
          until that endpoint exists.)
        </span>
      </p>
      <p>
        <strong>Name:</strong> {review.personal.full_name}
      </p>
      <p>
        <strong>Education:</strong> {review.education?.educational_background ?? "Not saved yet"}
      </p>
      <p>
        <strong>Test Dates:</strong>{" "}
        {review.test_dates.length > 0 ? review.test_dates.map((td) => td.test_name).join(", ") : "Not selected yet"}
      </p>
      <p>
        <strong>Preferences:</strong>{" "}
        {review.test_dates.some((td) => td.city_preferences.length > 0)
          ? review.test_dates
              .map((td) => `${td.test_name}: ${td.city_preferences.map((p) => p.city).join(", ")}`)
              .join(" | ")
          : "None saved yet"}
      </p>
      <p>
        <strong>Documents:</strong> {review.documents.length > 0 ? `${review.documents.length} uploaded` : "None uploaded yet"}
      </p>
    </div>
  );
}