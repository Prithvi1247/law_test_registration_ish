// ReviewStep.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApplicationReview } from "../../api/review";
import { submitApplicant } from "../../api/applicants";
import { ApiError, NetworkError } from "../../api/client";
import { useOnboarding } from "../../state/OnboardingContext";
import type { ApplicationReview } from "../../types/onboarding";

interface IncompleteDetail {
  detail?: { message?: string; missing?: string[] };
}

export function ReviewStep() {
  const navigate = useNavigate();
  const { applicantId, isSubmitted, setIsSubmitted } = useOnboarding();

  const [review, setReview] = useState<ApplicationReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (applicantId === null) return;
    setIsLoading(true);
    getApplicationReview(applicantId)
      .then(setReview)
      .catch((err) => {
        if (err instanceof ApiError || err instanceof NetworkError) setError(err.message);
        else setError("Could not load your application for review.");
      })
      .finally(() => setIsLoading(false));
  }, [applicantId]);

  async function handleSubmitApplication() {
    if (applicantId === null || isSubmitting) return;
    setError(null);
    setMissing(null);
    setIsSubmitting(true);
    try {
      await submitApplicant(applicantId);
      setIsSubmitted(true);
      navigate("/payment");
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as IncompleteDetail | undefined;
        if (err.status === 400 && body?.detail?.missing) {
          setMissing(body.detail.missing);
        } else {
          setError(err.message);
        }
      } else if (err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("Something went wrong while submitting your application.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (applicantId === null) return <p className="form-error">Please complete Personal Details first.</p>;
  if (isLoading) return <p>Loading your application…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!review) return null;

  const testDates = review.test_dates ?? [];
  const documents = review.documents ?? [];

  return (
    <div>
      <h2>Review</h2>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Personal Details {!isSubmitted && <Link to="/apply/personal">(edit)</Link>}</h3>
        <p>Name: {review.personal.full_name}</p>
        <p>Date of Birth: {review.personal.date_of_birth}</p>
        <p>Mobile: {review.personal.country_code} {review.personal.mobile_number}</p>
        <p>Category: {review.personal.category}</p>
        <p>NRI: {review.personal.is_nri ? "Yes" : "No"}</p>
        <p>Nationality: {review.personal.nationality}</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Education {!isSubmitted && <Link to="/apply/education">(edit)</Link>}</h3>
        <p>{review.education?.educational_background ?? "Not completed yet"}</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Test Dates &amp; Preferences {!isSubmitted && <Link to="/apply/test">(edit)</Link>}</h3>
        {testDates.length > 0 ? (
          testDates.map((td) => (
            <div key={td.id} style={{ marginBottom: "1rem" }}>
              <p>
                <strong>{td.test_name} — {td.test_date}</strong>{" "}
                {!isSubmitted && <Link to="/apply/preferences">(edit preferences)</Link>}
              </p>
              {td.city_preferences.length > 0 ? (
                <ol>
                  {td.city_preferences.map((p) => (
                    <li key={p.preference_rank}>{p.city}{p.state ? `, ${p.state}` : ""}</li>
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
        <h3>Photo / Documents {!isSubmitted && <Link to="/apply/documents">(edit)</Link>}</h3>
        {documents.length > 0 ? (
          <ul>
            {documents.map((d, i) => (
              <li key={i}>{d.document_type}: {d.original_filename ?? d.file_url}</li>
            ))}
          </ul>
        ) : (
          <p>Not uploaded yet</p>
        )}
      </section>

      {missing && (
        <div className="form-error">
          <p>Your application is incomplete. Please complete the following:</p>
          <ul>{missing.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}

      {isSubmitted ? (
        <p style={{ color: "#0a7a2f" }}>
          This application has been submitted and is now locked. <Link to="/payment">Go to Payment</Link>
        </p>
      ) : (
        <button type="button" onClick={handleSubmitApplication} disabled={isSubmitting}>
          {isSubmitting ? "Submitting…" : "Submit Application"}
        </button>
      )}
    </div>
  );
}