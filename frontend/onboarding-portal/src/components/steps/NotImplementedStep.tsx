interface NotImplementedStepProps {
  title: string;
}

/**
 * Placeholder for onboarding sections 2–7. Renders nothing functional —
 * exists only so the step shell (OnboardingFlow) has a real component to
 * mount for each section, matching the 7-step flow described in the spec.
 * Replace with the real form when that section is implemented.
 */
export function NotImplementedStep({ title }: NotImplementedStepProps) {
  return (
    <div>
      <h2>{title}</h2>
      <p>This section is not implemented yet.</p>
    </div>
  );
}