import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useOnboarding } from "../state/OnboardingContext";

/**
 * Gates /apply/* and /dashboard behind having an authenticated userId.
 * Does not create anything — just redirects to /login if missing.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { userId } = useOnboarding();

  if (userId === null) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
