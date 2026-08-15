import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { OnboardingState } from "../types/onboarding";

interface OnboardingContextValue extends OnboardingState {
  setUserId: (id: number) => void;
  setApplicantId: (id: number) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

/**
 * Wraps the whole onboarding flow (all 7 sections). Holds the identifiers
 * every later section needs — userId is assumed to already exist (from
 * signup/login, out of scope here), applicantId is produced by Section 1.
 *
 * Only Section 1 (Personal Details) is implemented against this state
 * right now; later sections will read applicantId from here instead of
 * re-creating an applicant.
 */
export function OnboardingProvider({
  children,
  initialUserId = null,
}: {
  children: ReactNode;
  initialUserId?: number | null;
}) {
  const [userId, setUserIdState] = useState<number | null>(initialUserId);
  const [applicantId, setApplicantIdState] = useState<number | null>(null);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      userId,
      applicantId,
      setUserId: setUserIdState,
      setApplicantId: setApplicantIdState,
    }),
    [userId, applicantId]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}