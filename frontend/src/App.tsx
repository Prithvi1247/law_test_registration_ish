import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { OnboardingProvider } from "./state/OnboardingContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { ApplyLayout } from "./pages/ApplyLayout";
import { HomePage } from "./pages/HomePage";
import { PersonalDetailsForm } from "./components/PersonalDetailsForm";
import { EducationStep } from "./components/steps/EducationStep";
import { TestDetailsStep } from "./components/steps/TestDetailsStep";
import { CityPreferencesStep } from "./components/steps/CityPreferencesStep";
import { DocumentsStep } from "./components/steps/DocumentsStep";
import { ReviewStep } from "./components/steps/ReviewStep";
import { PaymentDashboard } from "./pages/PaymentDashboard";
import { VerifyOtpPage } from "./pages/VerifyOtpPage";

// Best-effort mitigation for the browser back/forward cache (bfcache):
// after logout, pressing Back can restore a frozen snapshot of a
// previously-rendered authenticated page without re-running any of our
// code (including ProtectedRoute's check). Forcing a reload on a
// bfcache-restored navigation makes the app re-evaluate auth state fresh
// instead of momentarily showing the stale DOM snapshot. This is a
// browser-level limitation, not something client-side routing can fully
// close — logout itself already clears all real state, so there's no
// live session for a restored snapshot to interact with even if seen.
function useBfcacheReload() {
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
}

export function App() {
  useBfcacheReload();

  return (
    <OnboardingProvider>
      {/*
        The old wrapper here hardcoded maxWidth:640/padding inline, which
        capped every page — including the full-width header and wide
        content cards the new design system uses — at a phone-sized
        column. Each page/layout (LandingPage, ApplyLayout, auth pages)
        now owns its own width via .app-shell / .content-card / .auth-shell,
        so no global wrapper is needed here.
      */}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/verify-otp"
          element={
            <ProtectedRoute requireVerified={false}>
              <VerifyOtpPage />
            </ProtectedRoute>
          }
        />

        {/*
          /home is the authenticated applicant dashboard (replaces the old
          /dashboard route — DashboardPage.tsx is superseded by
          HomePage.tsx and can be removed). "My Application" in the header
          always points here.
        */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apply"
          element={
            <ProtectedRoute>
              <ApplyLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="personal" replace />} />
          <Route path="personal" element={<PersonalDetailsForm />} />
          <Route path="education" element={<EducationStep />} />
          <Route path="test" element={<TestDetailsStep />} />
          <Route path="preferences" element={<CityPreferencesStep />} />
          <Route path="documents" element={<DocumentsStep />} />
          <Route path="review" element={<ReviewStep />} />
        </Route>

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OnboardingProvider>
  );
}