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

export function App() {
  return (
    <OnboardingProvider>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

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
        </Routes>
      </div>
    </OnboardingProvider>
  );
}
