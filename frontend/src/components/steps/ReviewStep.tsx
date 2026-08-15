import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApplicationReview } from "../../api/review";
import { ApiError, NetworkError } from "../../api/client";
import { useOnboarding } from "../../state/OnboardingContext";
import type { ApplicationReview } from "../../types/onboarding";

export function ReviewStep() {
  const navigate = useNavigate();
  const { applicantId } = useOnboarding();

  const [review, setReview] = useState<ApplicationReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (applicantId === null) return;
    setIsLoading(true);
    // Always re-fetch on mount — Review must reflect the current DB state,
    // never stale data from an earlier visit in this session.
    getApplicationReview(applicantId)
      .then(setReview)
      .catch((err) => {
        if (err instanceof ApiError || err instanceof NetworkError) {
          setError(err.message);
        } else {
          setError("Could not load your application for review.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [applicantId]);

  if (applicantId === null) {
    return <p className="form-error">Please complete Personal Details first.</p>;
  }
  if (isLoading) return <p>Loading your application…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!review) return null;

  const testDates = review.test_dates ?? [];
  const documents = review.documents ?? [];

  return (
    <div>
      <h2>Review</h2>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>
          Personal Details <Link to="/apply/personal">(edit)</Link>
        </h3>
        <p>Name: {review.personal.full_name}</p>
        <p>Date of Birth: {review.personal.date_of_birth}</p>
        <p>
          Mobile: {review.personal.country_code} {review.personal.mobile_number}
        </p>
        <p>Category: {review.personal.category}</p>
        <p>NRI: {review.personal.is_nri ? "Yes" : "No"}</p>
        <p>Nationality: {review.personal.nationality}</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>
          Education <Link to="/apply/education">(edit)</Link>
        </h3>
        <p>{review.education?.educational_background ?? "Not completed yet"}</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>
          Test Dates &amp; Preferences <Link to="/apply/test">(edit)</Link>
        </h3>
        {testDates.length > 0 ? (
          testDates.map((td) => (
            <div key={td.id} style={{ marginBottom: "1rem" }}>
              <p>
                <strong>
                  {td.test_name} — {td.test_date}
                </strong>{" "}
                <Link to="/apply/preferences">(edit preferences)</Link>
              </p>
              {td.city_preferences.length > 0 ? (
                <ol>
                  {td.city_preferences.map((p) => (
                    <li key={p.preference_rank}>
                      {p.city}
                      {p.state ? `, ${p.state}` : ""}
                    </li>
                  ))}
                </ol>
              ) : (
                <p>No preferences saved for this date yet</p>
              )}
            </div>
          ))
        ) : (
          <p>Not selected yet</p>
        )}
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>
          Photo / Documents <Link to="/apply/documents">(edit)</Link>
        </h3>
        {documents.length > 0 ? (
          <ul>
            {documents.map((d, i) => (
              <li key={i}>
                {d.document_type}: {d.original_filename ?? d.file_url}
              </li>
            ))}
          </ul>
        ) : (
          <p>Not uploaded yet</p>
        )}
      </section>

      <button type="button" onClick={() => navigate("/apply/submit")}>
        Continue to Submission
      </button>
    </div>
  );
}