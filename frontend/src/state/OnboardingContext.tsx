import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { OnboardingState } from "../types/onboarding";

interface OnboardingContextValue extends OnboardingState {
  testDateIds: number[];
  isSubmitted: boolean;
  userMobile: string | null;
  isVerified: boolean;
  setUserId: (id: number) => void;
  setApplicantId: (id: number) => void;
  setTestDateIds: (ids: number[]) => void;
  setIsSubmitted: (submitted: boolean) => void;
  setUserMobile: (mobile: string | null) => void;
  setIsVerified: (verified: boolean) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

/**
 * Wraps the whole app (auth + the /apply/* onboarding flow). Holds the
 * identifiers/selections later sections need to read without re-fetching
 * or re-creating anything:
 *  - userId: set at Register/Login, never re-created afterwards
 *  - applicantId: set once Personal Details is saved
 *  - testDateIds: set once Test Date(s) are chosen, read by Preferences
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [userId, setUserIdState] = useState<number | null>(null);
  const [applicantId, setApplicantIdState] = useState<number | null>(null);
  const [testDateIds, setTestDateIdsState] = useState<number[]>([]);
  const [isSubmitted, setIsSubmittedState] = useState(false);
  const [userMobile, setUserMobileState] = useState<string | null>(null);
  const [isVerified, setIsVerifiedState] = useState(false);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      userId,
      applicantId,
      testDateIds,
      isSubmitted,
      userMobile,
      isVerified,
      setUserId: setUserIdState,
      setApplicantId: setApplicantIdState,
      setTestDateIds: setTestDateIdsState,
      setIsSubmitted: setIsSubmittedState,
      setUserMobile: setUserMobileState,
      setIsVerified: setIsVerifiedState,
    }),
    [userId, applicantId, testDateIds, isSubmitted, userMobile, isVerified]
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