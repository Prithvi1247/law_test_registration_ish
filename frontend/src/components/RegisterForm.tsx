import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUser } from "../api/users";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";
import { validateRegisterForm, isValid, type RegisterFormValues, type RegisterFormErrors } from "../validation/auth";
import "./AuthForm.css";

const emptyValues: RegisterFormValues = {
  email: "",
  mobile_number: "",
  password: "",
  confirm_password: "",
};

export function RegisterForm() {
  const navigate = useNavigate();
  const { setUserId, setUserMobile } = useOnboarding();

  const [values, setValues] = useState<RegisterFormValues>(emptyValues);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof RegisterFormValues>(field: K, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const validationErrors = validateRegisterForm(values);
    setErrors(validationErrors);
    if (!isValid(validationErrors)) return;

    setIsSubmitting(true);
    try {
      const user = await createUser({
        email: values.email.trim(),
        mobile_number: values.mobile_number.trim(),
        password: values.password,
      });
      setUserId(user.id);
      setUserMobile(user.mobile_number);
      navigate("/verify-otp");
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong while creating your account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Create your account</h2>

      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => updateField("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
        />
        {errors.email && <p className="field-error">{errors.email}</p>}
      </div>

      <div className="field">
        <label htmlFor="mobile_number">Mobile Number</label>
        <input
          id="mobile_number"
          type="tel"
          value={values.mobile_number}
          onChange={(e) => updateField("mobile_number", e.target.value)}
          aria-invalid={Boolean(errors.mobile_number)}
        />
        {errors.mobile_number && <p className="field-error">{errors.mobile_number}</p>}
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

      <div className="field">
        <label htmlFor="confirm_password">Confirm Password</label>
        <input
          id="confirm_password"
          type="password"
          value={values.confirm_password}
          onChange={(e) => updateField("confirm_password", e.target.value)}
          aria-invalid={Boolean(errors.confirm_password)}
        />
        {errors.confirm_password && <p className="field-error">{errors.confirm_password}</p>}
      </div>

      {submitError && <p className="form-error">{submitError}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Register"}
      </button>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}