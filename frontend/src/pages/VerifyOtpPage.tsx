import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp } from "../api/otp";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";
import { AppShell } from "../components/layout/AppShell";
import "../components/AuthForm.css";

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const { userId, isVerified, setIsVerified } = useOnboarding();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (isVerified) {
      navigate("/apply/personal");
      return;
    }
    handleSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSend() {
    if (userId === null) return;
    setError(null);
    setIsSending(true);
    try {
      const res = await sendOtp(userId);
      setDevOtp(res.dev_otp);
      setCooldown(30);
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("Could not send OTP. Please try again.");
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (userId === null) return;
    setError(null);
    setIsVerifying(true);
    try {
      await verifyOtp(userId, otp.trim());
      setIsVerified(true);
      navigate("/apply/personal");
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) {
        setError(err.message);
      } else {
        setError("Could not verify OTP. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <AppShell>
      <div className="auth-shell">
        <form className="auth-form" onSubmit={handleVerify} noValidate>
          <h2>Verify your account</h2>
          <p className="auth-form__description">
            Enter the 6-digit code sent to your registered mobile number.
          </p>

          {devOtp && (
            <div className="alert alert-info">
              <p style={{ margin: 0 }}>
                Development mode — OTP: <strong>{devOtp}</strong>
              </p>
            </div>
          )}

          <div className="field">
            <label htmlFor="otp">6-digit code</label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              style={{
                textAlign: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "1.5rem",
                letterSpacing: "0.6em",
                paddingLeft: "0.9em", // visually re-centers the letter-spaced text
              }}
            />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" disabled={isVerifying || otp.length !== 6}>
            {isVerifying ? "Verifying…" : "Verify"}
          </button>

          <div className="otp-resend" style={{ marginTop: "var(--space-4)" }}>
            {cooldown > 0 ? (
              <span>Resend code in {cooldown}s</span>
            ) : (
              <button type="button" onClick={handleSend} disabled={isSending}>
                {isSending ? "Sending…" : "Resend OTP"}
              </button>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}