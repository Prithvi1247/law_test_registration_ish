import { Routes, Route, Navigate } from "react-router-dom";
import { OnboardingProvider } from "./state/OnboardingContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { RegisterPage } from "./pages/RegisterPage";
import { LoginPage } from "./pages/LoginPage";
import { ApplyLayout } from "./pages/ApplyLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { PersonalDetailsForm } from "./components/PersonalDetailsForm";
import { EducationStep } from "./components/steps/EducationStep";
import { TestDetailsStep } from "./components/steps/TestDetailsStep";
import { CityPreferencesStep } from "./components/steps/CityPreferencesStep";
import { DocumentsStep } from "./components/steps/DocumentsStep";
import { ReviewStep } from "./components/steps/ReviewStep";
import { PaymentDashboard } from "./pages/PaymentDashboard";
import { VerifyOtpPage } from "./pages/VerifyOtpPage";

export function App() {
  return (
    <OnboardingProvider>
      {/*
        The old wrapper here hardcoded maxWidth:640/padding inline, which
        capped every page — including the full-width header and wide
        content cards the new design system uses — at a phone-sized
        column. Each page/layout (LandingPage, ApplyLayout, auth pages)
        now owns its own width via .app-shell / .content-card / .auth-shell,
        so no global wrapper is needed here. Routing is unchanged.
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

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OnboardingProvider>
  );
}