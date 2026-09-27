import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOnboarding } from "../state/OnboardingContext";

/**
 * Gates routes behind an authenticated userId, and optionally behind
 * account verification too. Does not create anything — just redirects.
 *
 * When redirecting to /login or /verify-otp, the current location is
 * attached as `state.from` so the post-login/post-verify flow can send
 * the person back to what they actually asked for, instead of always
 * landing on /home.
 */
export function ProtectedRoute({
  children,
  requireVerified = true,
}: {
  children: ReactNode;
  requireVerified?: boolean;
}) {
  const { userId, isVerified } = useOnboarding();
  const location = useLocation();

  if (userId === null) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireVerified && !isVerified) {
    return <Navigate to="/verify-otp" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}