// ReviewStep.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApplicationReview } from "../../api/review";
import { submitApplicant } from "../../api/applicants";
import { ApiError, NetworkError } from "../../api/client";
import { useOnboarding } from "../../state/OnboardingContext";
import type { ApplicationReview } from "../../types/onboarding";
import "./steps.css";

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

  if (applicantId === null)
    return (
      <div className="content-card">
        <p className="form-error" role="alert">Please complete Personal Details first.</p>
      </div>
    );
  if (isLoading) return <div className="content-card"><p>Loading your application…</p></div>;
  if (error) return <div className="content-card"><p className="form-error" role="alert">{error}</p></div>;
  if (!review) return null;

  const testDates = review.test_dates ?? [];
  const documents = review.documents ?? [];

  return (
    <div className="content-card">
      <p className="content-card__eyebrow">Application · Step 6 of 6</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <h2 className="content-card__title">Review</h2>
        {isSubmitted ? (
          <span className="badge badge-locked">Submitted &amp; locked</span>
        ) : (
          <span className="badge badge-draft">Draft</span>
        )}
      </div>
      <p className="content-card__description">
        Please review your application carefully before submitting. You won't be able to make changes afterwards.
      </p>

      <div className="review-card">
        <div className="review-card__header">
          <h3>Personal Details</h3>
          {!isSubmitted && <Link to="/apply/personal">Edit</Link>}
        </div>
        <dl>
          <div className="review-row">
            <dt>Name</dt>
            <dd>{review.personal.full_name}</dd>
          </div>
          <div className="review-row">
            <dt>Date of Birth</dt>
            <dd>{review.personal.date_of_birth}</dd>
          </div>
          <div className="review-row">
            <dt>Mobile</dt>
            <dd>{review.personal.country_code} {review.personal.mobile_number}</dd>
          </div>
          <div className="review-row">
            <dt>Category</dt>
            <dd>{review.personal.category}</dd>
          </div>
          <div className="review-row">
            <dt>NRI</dt>
            <dd>{review.personal.is_nri ? "Yes" : "No"}</dd>
          </div>
          <div className="review-row">
            <dt>Nationality</dt>
            <dd>{review.personal.nationality}</dd>
          </div>
        </dl>
      </div>

      <div className="review-card">
        <div className="review-card__header">
          <h3>Education</h3>
          {!isSubmitted && <Link to="/apply/education">Edit</Link>}
        </div>
        <p style={{ margin: 0 }}>{review.education?.educational_background ?? "Not completed yet"}</p>
      </div>

      <div className="review-card">
        <div className="review-card__header">
          <h3>Test Dates &amp; Preferences</h3>
          {!isSubmitted && <Link to="/apply/test">Edit</Link>}
        </div>
        {testDates.length > 0 ? (
          testDates.map((td) => (
            <div key={td.id} className="review-sub">
              <p className="review-sub__title">
                {td.test_name} — {td.test_date}{" "}
                {!isSubmitted && <Link to="/apply/preferences">(edit preferences)</Link>}
              </p>
              {td.city_preferences.length > 0 ? (
                <ol>
                  {td.city_preferences.map((p) => (
                    <li key={p.preference_rank}>{p.city}{p.state ? `, ${p.state}` : ""}</li>
                  ))}
                </ol>
              ) : (
                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--fs-sm)" }}>
                  No preferences saved for this date yet
                </p>
              )}
            </div>
          ))
        ) : (
          <p style={{ margin: 0 }}>Not selected yet</p>
        )}
      </div>

      <div className="review-card">
        <div className="review-card__header">
          <h3>Photo / Documents</h3>
          {!isSubmitted && <Link to="/apply/documents">Edit</Link>}
        </div>
        {documents.length > 0 ? (
          <ul style={{ margin: 0 }}>
            {documents.map((d, i) => (
              <li key={i}>{d.document_type}: {d.original_filename ?? d.file_url}</li>
            ))}
          </ul>
        ) : (
          <p style={{ margin: 0 }}>Not uploaded yet</p>
        )}
      </div>

      {missing && (
        <div className="form-error" role="alert">
          <p>Your application is incomplete. Please complete the following:</p>
          <ul style={{ margin: 0 }}>{missing.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      )}

      {isSubmitted ? (
        <div className="submit-success">
          <div className="submit-success__icon" aria-hidden="true">✓</div>
          <h2>Application Submitted</h2>
          <p>Your application has been successfully submitted and is now locked.</p>
          <div className="step-actions" style={{ justifyContent: "center", border: "none", paddingTop: 0 }}>
            <Link to="/payment" className="btn btn-primary">Continue to Payment →</Link>
          </div>
        </div>
      ) : (
        <div className="step-actions">
          <button type="button" className="btn btn-primary" onClick={handleSubmitApplication} disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit Application"}
          </button>
        </div>
      )}
    </div>
  );
}