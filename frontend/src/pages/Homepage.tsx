import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApplicantByUserId } from "../api/applicants";
import { getApplicationReview } from "../api/review";
import { getPaymentDashboard } from "../api/payment";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";
import { AppShell } from "../components/layout/AppShell";
import { APPLY_STEPS } from "../components/constants/applySteps";
import type { ApplicationReview, PaymentDashboard as PaymentDashboardType } from "../types/onboarding";
import "./HomePage.css";

// Derives per-step completion from the same review payload every step
// component already prefills itself from — nothing here is fabricated or
// tracked separately from what the backend actually reports.
function computeStepCompletion(review: ApplicationReview | null, isSubmitted: boolean): boolean[] {
  if (!review) return APPLY_STEPS.map(() => false);
  const hasTestDates = review.test_dates.length > 0;
  return [
    true, // Personal Details: a review exists at all only once the applicant record does
    review.education !== null,
    hasTestDates,
    hasTestDates && review.test_dates.every((td) => td.city_preferences.length > 0),
    review.documents.some((d) => d.document_type === "PHOTO"),
    isSubmitted, // Review/submit is the same "isSubmitted" flag ReviewStep itself sets
  ];
}

export function HomePage() {
  const navigate = useNavigate();
  const { userId, applicantId, setApplicantId, isSubmitted, userMobile } = useOnboarding();

  const [review, setReview] = useState<ApplicationReview | null>(null);
  const [payment, setPayment] = useState<PaymentDashboardType | null>(null);
  const [hasApplicant, setHasApplicant] = useState<boolean | null>(null); // null = still checking
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        let currentApplicantId = applicantId;

        // Recover applicantId if this session only had userId persisted
        // (e.g. a refresh right after a fresh login) — the exact same
        // lookup LoginForm performs, reused rather than reimplemented.
        if (currentApplicantId === null && userId !== null) {
          try {
            const applicant = await getApplicantByUserId(userId);
            currentApplicantId = applicant.id;
            if (!cancelled) setApplicantId(applicant.id);
          } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
              if (!cancelled) setHasApplicant(false);
              return;
            }
            throw err;
          }
        }

        if (currentApplicantId === null) {
          if (!cancelled) setHasApplicant(false);
          return;
        }

        if (!cancelled) setHasApplicant(true);
        const reviewData = await getApplicationReview(currentApplicantId);
        if (!cancelled) setReview(reviewData);

        if (isSubmitted) {
          try {
            const paymentData = await getPaymentDashboard(currentApplicantId);
            if (!cancelled) setPayment(paymentData);
          } catch {
            // Non-fatal — payment status is a summary extra here, not
            // required to render the rest of the dashboard.
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError || err instanceof NetworkError) setError(err.message);
          else setError("Could not load your application.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, applicantId, isSubmitted]);

  if (isLoading || hasApplicant === null) {
    return (
      <AppShell>
        <div className="content-card">
          <p>Loading your application…</p>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="content-card">
          <p className="form-error" role="alert">{error}</p>
        </div>
      </AppShell>
    );
  }

  if (!hasApplicant) {
    return (
      <AppShell>
        <div className="content-card">
          <p className="content-card__eyebrow">Welcome</p>
          <h2 className="content-card__title">Let's start your application</h2>
          <p className="content-card__description">
            You haven't started an SLAT application yet. It only takes a few minutes to begin.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => navigate("/apply/personal")}>
            Start Application
          </button>
        </div>
      </AppShell>
    );
  }

  const completion = computeStepCompletion(review, isSubmitted);
  const completedCount = completion.filter(Boolean).length;
  const firstIncompleteIndex = completion.findIndex((done) => !done);
  const allComplete = firstIncompleteIndex === -1;

  const continueTarget = allComplete ? "/payment" : `/apply/${APPLY_STEPS[firstIncompleteIndex].path}`;
  const continueLabel = allComplete ? "Go to Payment" : "Continue Application";

  return (
    <AppShell>
      <div className="content-card">
        <p className="content-card__eyebrow">Applicant Home</p>
        <div className="home-header-row">
          <h2 className="content-card__title">
            Welcome back{review?.personal.full_name ? `, ${review.personal.full_name.split(" ")[0]}` : ""}
          </h2>
          <span className={`badge ${isSubmitted ? "badge-locked" : "badge-draft"}`}>
            {isSubmitted ? "Submitted" : "Draft"}
          </span>
        </div>
        <p className="field-hint" style={{ marginTop: 0, marginBottom: "var(--space-6)" }}>
          Application ID: {applicantId}
          {userMobile ? ` · Registered mobile: ${userMobile}` : ""}
        </p>

        <div className="form-section">
          <h3 className="form-section__title">Application Progress</h3>
          <ul className="progress-checklist">
            {APPLY_STEPS.map((step, index) => {
              const state = completion[index] ? "done" : index === firstIncompleteIndex ? "current" : "todo";
              return (
                <li key={step.path} className={`progress-checklist__item is-${state}`}>
                  <span className="progress-checklist__icon" aria-hidden="true">
                    {state === "done" ? "✓" : state === "current" ? "→" : "○"}
                  </span>
                  {step.label}
                </li>
              );
            })}
          </ul>
          <p className="progress-checklist__count">
            {completedCount} / {APPLY_STEPS.length} steps completed
          </p>

          <button type="button" className="btn btn-primary" onClick={() => navigate(continueTarget)}>
            {continueLabel}
          </button>
        </div>

        <div className="form-section">
          <h3 className="form-section__title">Application Summary</h3>
          <dl>
            <div className="review-row">
              <dt>Name</dt>
              <dd>{review?.personal.full_name ?? "—"}</dd>
            </div>
            <div className="review-row">
              <dt>Education</dt>
              <dd>{review?.education?.educational_background ?? "Not completed yet"}</dd>
            </div>
            <div className="review-row">
              <dt>Test Dates</dt>
              <dd>
                {review && review.test_dates.length > 0
                  ? review.test_dates.map((td) => td.test_name).join(", ")
                  : "Not selected yet"}
              </dd>
            </div>
            <div className="review-row">
              <dt>Test Centre Preferences</dt>
              <dd>
                {review && review.test_dates.some((td) => td.city_preferences.length > 0)
                  ? review.test_dates
                      .filter((td) => td.city_preferences.length > 0)
                      .map((td) => `${td.test_name}: ${td.city_preferences.map((p) => p.city).join(", ")}`)
                      .join(" | ")
                  : "Not saved yet"}
              </dd>
            </div>
            <div className="review-row">
              <dt>Documents</dt>
              <dd>{review && review.documents.length > 0 ? `${review.documents.length} uploaded` : "None uploaded yet"}</dd>
            </div>
            <div className="review-row">
              <dt>Payment</dt>
              <dd>
                {!isSubmitted
                  ? "Not applicable yet — submit your application first"
                  : payment?.payment?.payment_status ?? "Not started"}
              </dd>
            </div>
          </dl>

          {!isSubmitted && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/apply/review")}
              style={{ marginTop: "var(--space-4)" }}
            >
              View / Review Application
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}