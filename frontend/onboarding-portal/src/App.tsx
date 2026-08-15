import { OnboardingFlow } from "./pages/OnboardingFlow";

// Authentication/session (login, signup, POST /users) is out of scope for
// this task. In the real app, userId would come from the authenticated
// session. This stub stands in for that until auth is wired up.
const STUB_USER_ID = 1;

export function App() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1rem" }}>
      <OnboardingFlow userId={STUB_USER_ID} />
    </div>
  );
}