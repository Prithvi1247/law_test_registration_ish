import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";
import { validateLoginForm, isValid, type LoginFormValues, type LoginFormErrors } from "../validation/auth";
import "./AuthForm.css";
import { getApplicantByUserId } from "../api/applicants";

const emptyValues: LoginFormValues = { identifier: "", password: "" };

export function LoginForm() {
  const navigate = useNavigate();
  const { setUserId, setApplicantId, setIsSubmitted, setUserMobile, setIsVerified } = useOnboarding();

  const [values, setValues] = useState<LoginFormValues>(emptyValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof LoginFormValues>(field: K, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateLoginForm(values);
    setErrors(validationErrors);
    if (!isValid(validationErrors)) return;

    setIsSubmitting(true);
    try {
      const user = await login({
        identifier: values.identifier.trim(),
        password: values.password,
      });
      setUserId(user.id);
      setUserMobile(user.mobile_number);
      setIsVerified(user.is_verified);

      if (!user.is_verified) {
        // Unverified account — OTP verification takes priority over
        // applicant recovery; nothing past this point should run yet.
        navigate("/verify-otp");
        return;
      }

      try {
        const applicant = await getApplicantByUserId(user.id);
        // Existing applicant found.
        setApplicantId(applicant.id);
        if (applicant.status === "submitted") {
          // Application is complete and locked.
          setIsSubmitted(true);
          navigate("/payment");
        } else {
          // Existing draft application — Personal Details loads the
          // saved data and allows editing.
          setIsSubmitted(false);
          navigate("/apply/personal");
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          // Valid user, but no applicant/application exists yet.
          setApplicantId(null);
          setIsSubmitted(false);
          navigate("/apply/personal");
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong while logging in. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Log in</h2>

      <div className="field">
        <label htmlFor="identifier">Email or Mobile Number</label>
        <input
          id="identifier"
          type="text"
          value={values.identifier}
          onChange={(e) => updateField("identifier", e.target.value)}
          aria-invalid={Boolean(errors.identifier)}
        />
        {errors.identifier && <p className="field-error">{errors.identifier}</p>}
      </div>

      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={values.password}
          onChange={(e) => updateField("password", e.target.value)}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && <p className="field-error">{errors.password}</p>}
      </div>

      {submitError && <p className="form-error">{submitError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging in…" : "Log in"}
      </button>

      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </form>
  );
}