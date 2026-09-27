import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { OnboardingState } from "../types/onboarding";

interface OnboardingContextValue extends OnboardingState {
  testDateIds: number[];
  isSubmitted: boolean;
  userMobile: string | null;
  isVerified: boolean;
  setUserId: (id: number) => void;
  // Widened vs. the original (number) => void: LoginForm already calls this
  // with null on a 404 (no applicant yet) — that was a pre-existing type
  // mismatch, fixed here rather than worked around at the call site.
  setApplicantId: (id: number | null) => void;
  setTestDateIds: (ids: number[]) => void;
  setIsSubmitted: (submitted: boolean) => void;
  setUserMobile: (mobile: string | null) => void;
  setIsVerified: (verified: boolean) => void;
  /**
   * Clears all session state (context + persisted storage) so no
   * applicant-specific data survives. Callers are responsible for
   * navigating away afterwards (see AppShell's handleLogout).
   */
  logout: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

// Namespaced so it can't collide with anything else the app (or a future
// api/client.ts auth token) might store.
const STORAGE_KEY = "slat.onboarding.session.v1";

interface PersistedSession {
  userId: number | null;
  applicantId: number | null;
  testDateIds: number[];
  isSubmitted: boolean;
  userMobile: string | null;
  isVerified: boolean;
}

const emptySession: PersistedSession = {
  userId: null,
  applicantId: null,
  testDateIds: [],
  isSubmitted: false,
  userMobile: null,
  isVerified: false,
};

// sessionStorage (not localStorage): it survives a refresh within the same
// tab — satisfying "refresh keeps you logged in" — but is gone the moment
// the tab/window closes, so it never quietly persists a session longer
// than the person was actually using the app.
function loadPersistedSession(): PersistedSession {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession;
    const parsed = JSON.parse(raw);
    return { ...emptySession, ...parsed };
  } catch {
    // Corrupted value or storage unavailable (e.g. private browsing) —
    // fail safe to a clean, unauthenticated session rather than throwing.
    return emptySession;
  }
}

function persistSession(session: PersistedSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable — session just won't survive a refresh; not fatal.
  }
}

function clearPersistedSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

/**
 * Wraps the whole app (auth + the /apply/* onboarding flow). Holds the
 * identifiers/selections later sections need to read without re-fetching
 * or re-creating anything:
 *  - userId: set at Register/Login, never re-created afterwards
 *  - applicantId: set once Personal Details is saved
 *  - testDateIds: set once Test Date(s) are chosen, read by Preferences
 *
 * State is rehydrated from sessionStorage on load (so a refresh doesn't
 * drop the user back to a blank/unauthenticated state) and re-persisted
 * on every change. logout() clears both the context and the storage.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  // Lazy initializer: reads storage synchronously on first render, so
  // there's no loading flicker between "unauthenticated" and "restored".
  const initial = useMemo(loadPersistedSession, []);

  const [userId, setUserIdState] = useState<number | null>(initial.userId);
  const [applicantId, setApplicantIdState] = useState<number | null>(initial.applicantId);
  const [testDateIds, setTestDateIdsState] = useState<number[]>(initial.testDateIds);
  const [isSubmitted, setIsSubmittedState] = useState(initial.isSubmitted);
  const [userMobile, setUserMobileState] = useState<string | null>(initial.userMobile);
  const [isVerified, setIsVerifiedState] = useState(initial.isVerified);

  useEffect(() => {
    persistSession({ userId, applicantId, testDateIds, isSubmitted, userMobile, isVerified });
  }, [userId, applicantId, testDateIds, isSubmitted, userMobile, isVerified]);

  function logout() {
    clearPersistedSession();
    setUserIdState(null);
    setApplicantIdState(null);
    setTestDateIdsState([]);
    setIsSubmittedState(false);
    setUserMobileState(null);
    setIsVerifiedState(false);
  }

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
      logout,
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