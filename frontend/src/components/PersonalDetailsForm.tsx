import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { emptyPersonalDetails, type PersonalDetails } from "../types/onboarding";
import { validatePersonalDetails, isValid, type PersonalDetailsErrors } from "../validation/personalDetails";
import { createApplicant, updateApplicant } from "../api/applicants";
import { getApplicationReview } from "../api/review";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";
import { NATIONALITY_OPTIONS } from "./constants/nationalities";
import "./PersonalDetailsForm.css";

// Category list is a UI-only convenience for the <select>; the value sent
// to the backend is always the plain string the user picked, per contract.
const CATEGORY_OPTIONS = ["General", "OBC", "SC", "ST", "EWS"];

export function PersonalDetailsForm() {
  const navigate = useNavigate();
  // ProtectedRoute guarantees userId is set (and the account verified)
  // before this component mounts.
  const { userId, applicantId, setApplicantId, userMobile } = useOnboarding();

  const [values, setValues] = useState<PersonalDetails>(emptyPersonalDetails);
  const [errors, setErrors] = useState<PersonalDetailsErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  // Mobile number is a USER-level, registered field — always shown from
  // context, never from what the user might type. Falls back to whatever
  // the saved applicant record has if context wasn't populated (e.g. a
  // hard refresh mid-session), since that value is still the same
  // authoritative user mobile the backend enforces server-side.
  useEffect(() => {
    if (userMobile) {
      setValues((prev) => ({ ...prev, mobile_number: userMobile }));
    }
  }, [userMobile]);

  // Edit mode: prefill from the current DB state (not stale context) so
  // Review → Edit always shows what's actually saved.
  useEffect(() => {
    if (applicantId === null) return;
    setIsLoadingExisting(true);
    getApplicationReview(applicantId)
      .then((review) => {
        const p = review.personal;
        setValues({
          full_name: p.full_name,
          date_of_birth: p.date_of_birth,
          nationality: p.nationality,
          is_nri: p.is_nri,
          country_code: p.country_code,
          mobile_number: userMobile ?? p.mobile_number,
          category: p.category,
        });
      })
      .catch(() => {
        // Non-fatal — user can still fill the form manually.
        setSubmitError("Could not load your existing details. You can still edit and save below.");
      })
      .finally(() => setIsLoadingExisting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  function updateField<K extends keyof PersonalDetails>(field: K, value: PersonalDetails[K]) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear the field-level error as soon as the user edits it.
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    if (userId === null) {
      // Shouldn't happen — ProtectedRoute redirects to /login first — but
      // guard against it rather than sending a request with a null user_id.
      setSubmitError("You need to be logged in to continue. Please log in again.");
      return;
    }

    const validationErrors = validatePersonalDetails(values);
    setErrors(validationErrors);
    if (!isValid(validationErrors)) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (applicantId !== null) {
        const applicant = await updateApplicant(applicantId, {
          full_name: values.full_name.trim(),
          date_of_birth: values.date_of_birth,
          country_code: values.country_code.trim(),
          mobile_number: values.mobile_number.trim(),
          category: values.category,
          is_nri: values.is_nri as boolean,
          nationality: values.nationality.trim(),
        });

        setApplicantId(applicant.id);
        navigate("/apply/education");
        return;
      }

      const applicant = await createApplicant({
        user_id: userId,
        full_name: values.full_name.trim(),
        date_of_birth: values.date_of_birth,
        country_code: values.country_code.trim(),
        mobile_number: values.mobile_number.trim(),
        category: values.category,
        is_nri: values.is_nri as boolean, // validated non-null above
        nationality: values.nationality.trim(),
      });

      setApplicantId(applicant.id);
      navigate("/apply/education");
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else if (err instanceof NetworkError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong while saving your details. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="personal-details-form" onSubmit={handleSubmit} noValidate>
      <h2>Personal Details</h2>

      <div className="field">
        <label htmlFor="full_name">Full Name</label>
        <input
          id="full_name"
          type="text"
          value={values.full_name}
          onChange={(e) => updateField("full_name", e.target.value)}
          aria-invalid={Boolean(errors.full_name)}
          aria-describedby={errors.full_name ? "full_name-error" : undefined}
        />
        {errors.full_name && (
          <p className="field-error" id="full_name-error">
            {errors.full_name}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="date_of_birth">Date of Birth</label>
        <input
          id="date_of_birth"
          type="date"
          value={values.date_of_birth}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => updateField("date_of_birth", e.target.value)}
          aria-invalid={Boolean(errors.date_of_birth)}
          aria-describedby={errors.date_of_birth ? "date_of_birth-error" : undefined}
        />
        {errors.date_of_birth && (
          <p className="field-error" id="date_of_birth-error">
            {errors.date_of_birth}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="nationality">Nationality</label>
        <select
          id="nationality"
          value={values.nationality}
          onChange={(e) => updateField("nationality", e.target.value)}
          aria-invalid={Boolean(errors.nationality)}
          aria-describedby={errors.nationality ? "nationality-error" : undefined}
        >
          {NATIONALITY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.nationality && (
          <p className="field-error" id="nationality-error">
            {errors.nationality}
          </p>
        )}
      </div>

      <fieldset className="field">
        <legend>Are you an NRI?</legend>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="is_nri"
              checked={values.is_nri === true}
              onChange={() => updateField("is_nri", true)}
            />
            Yes
          </label>
          <label>
            <input
              type="radio"
              name="is_nri"
              checked={values.is_nri === false}
              onChange={() => updateField("is_nri", false)}
            />
            No
          </label>
        </div>
        {errors.is_nri && <p className="field-error">{errors.is_nri}</p>}
      </fieldset>

      <div className="field-row">
        <div className="field field-small">
          <label htmlFor="country_code">Country Code</label>
          <input
            id="country_code"
            type="text"
            value={values.country_code}
            onChange={(e) => updateField("country_code", e.target.value)}
            aria-invalid={Boolean(errors.country_code)}
          />
          {errors.country_code && <p className="field-error">{errors.country_code}</p>}
        </div>

        <div className="field field-grow">
          <label htmlFor="mobile_number">Mobile Number (registered)</label>
          <input
            id="mobile_number"
            type="tel"
            value={values.mobile_number}
            readOnly
            disabled
            aria-invalid={Boolean(errors.mobile_number)}
            aria-describedby={errors.mobile_number ? "mobile_number-error" : undefined}
          />
          <p style={{ fontSize: "0.8rem", color: "#888", margin: "0.25rem 0 0" }}>
            This is your registered account mobile number and can't be changed here.
          </p>
          {errors.mobile_number && (
            <p className="field-error" id="mobile_number-error">
              {errors.mobile_number}
            </p>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={values.category}
          onChange={(e) => updateField("category", e.target.value)}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? "category-error" : undefined}
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="field-error" id="category-error">
            {errors.category}
          </p>
        )}
      </div>

      {submitError && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting || isLoadingExisting}>
        {isSubmitting ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}