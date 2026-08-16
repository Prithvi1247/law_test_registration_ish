import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOnboarding } from "../state/OnboardingContext";

/**
 * Gates routes behind an authenticated userId, and optionally behind
 * account verification too. Does not create anything — just redirects.
 */
export function ProtectedRoute({
  children,
  requireVerified = true,
}: {
  children: ReactNode;
  requireVerified?: boolean;
}) {
  const { userId, isVerified } = useOnboarding();

  if (userId === null) {
    return <Navigate to="/login" replace />;
  }

  if (requireVerified && !isVerified) {
    return <Navigate to="/verify-otp" replace />;
  }

  return <>{children}</>;
}