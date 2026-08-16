import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { saveEducation } from "../../api/education";
import { getApplicationReview } from "../../api/review";
import { ApiError, NetworkError } from "../../api/client";
import { useOnboarding } from "../../state/OnboardingContext";
import "./steps.css";

export function EducationStep() {
  const navigate = useNavigate();
  const { applicantId } = useOnboarding();

  const [educationalBackground, setEducationalBackground] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // Edit mode: prefill from the current DB state, not stale context.
  useEffect(() => {
    if (applicantId === null) return;
    setIsLoadingExisting(true);
    getApplicationReview(applicantId)
      .then((review) => {
        if (review.education) {
          setEducationalBackground(review.education.educational_background);
        }
      })
      .catch(() => {
        // Non-fatal — user can still fill the form manually.
      })
      .finally(() => setIsLoadingExisting(false));
  }, [applicantId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (applicantId === null) {
      setError("Please complete Personal Details first.");
      return;
    }

    if (!educationalBackground.trim()) {
      setError("Educational background is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Same POST endpoint for first save and edits — backend upserts by
      // applicant_id, so this never creates a second row.
      await saveEducation(applicantId, educationalBackground.trim());
      navigate("/apply/test");
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("Something went wrong while saving your education details.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="content-card" onSubmit={handleSubmit} noValidate>
      <p className="content-card__eyebrow">Application · Step 2 of 6</p>
      <h2 className="content-card__title">Education</h2>
      <p className="content-card__description">
        Tell us about your current or most recently completed academic qualification.
      </p>

      <div className="form-section">
        <div className="field">
          <label htmlFor="educational_background">
            Educational Background<span className="required-mark">*</span>
          </label>
          <input
            id="educational_background"
            type="text"
            placeholder="e.g. 12th Standard - CBSE"
            value={educationalBackground}
            onChange={(e) => setEducationalBackground(e.target.value)}
          />
          <p className="field-hint">Include the board or university and year of completion, if applicable.</p>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="step-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || isLoadingExisting}>
          {isSubmitting ? "Saving…" : "Continue"}
        </button>
      </div>
    </form>
  );
}