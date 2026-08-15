import { useState } from "react";
import { OnboardingProvider, useOnboarding } from "../state/OnboardingContext";
import { PersonalDetailsForm } from "../components/PersonalDetailsForm";
import { EducationStep } from "../components/steps/EducationStep";
import { TestDetailsStep } from "../components/steps/TestDetailsStep";
import { CityPreferencesStep } from "../components/steps/CityPreferencesStep";
import { DocumentsStep } from "../components/steps/DocumentsStep";
import { ReviewStep } from "../components/steps/ReviewStep";
import { SubmissionStep } from "../components/steps/SubmissionStep";

// The full 7-step flow from the spec, in order. Only "personal" is
// functional; the rest render placeholders (see components/steps/).
const STEPS = [
    "personal",
    "education",
    "test",
    "city",
    "documents",
    "review",
    "submit",
  ] as const;

type Step = (typeof STEPS)[number];

function OnboardingFlowInner() {
  const [step, setStep] = useState<Step>("personal");

  function goToNext() {
    const currentIndex = STEPS.indexOf(step);
    const next = STEPS[currentIndex + 1];
    if (next) setStep(next);
  }

  switch (step) {
    case "personal":
      return <PersonalDetailsForm onContinue={goToNext} />;
    case "education":
      return <EducationStep />;
    case "test":
      return <TestDetailsStep />;
    case "city":
      return <CityPreferencesStep />;
    case "documents":
      return <DocumentsStep />;
    case "review":
      return <ReviewStep />;
    case "submit":
      return <SubmissionStep />;
  }
}

/**
 * userId would normally come from an authenticated session (login/signup),
 * which is out of scope for this task. It's accepted as a prop here so
 * this flow can be mounted once that's wired up.
 */
export function OnboardingFlow({ userId }: { userId: number }) {
  return (
    <OnboardingProvider initialUserId={userId}>
      <OnboardingFlowInner />
    </OnboardingProvider>
  );
}