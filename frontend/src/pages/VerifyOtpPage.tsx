import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtp, verifyOtp } from "../api/otp";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";

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
    <form className="auth-form" onSubmit={handleVerify} noValidate>
      <h2>Verify your account</h2>
      <p>Enter the 6-digit code sent to your registered mobile number.</p>

      {devOtp && (
        <p style={{ color: "#888" }}>
          Development mode — OTP: <strong>{devOtp}</strong>
        </p>
      )}

      <div className="field">
        <label htmlFor="otp">OTP</label>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" disabled={isVerifying || otp.length !== 6}>
        {isVerifying ? "Verifying…" : "Verify"}
      </button>

      <button type="button" onClick={handleSend} disabled={isSending || cooldown > 0} style={{ marginLeft: "0.5rem" }}>
        {cooldown > 0 ? `Resend in ${cooldown}s` : isSending ? "Sending…" : "Resend OTP"}
      </button>
    </form>
  );
}