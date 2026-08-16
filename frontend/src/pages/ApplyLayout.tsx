import { Outlet, useLocation } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";

const APPLY_STEPS = [
  { path: "personal", label: "Personal" },
  { path: "education", label: "Education" },
  { path: "test", label: "Test" },
  { path: "preferences", label: "Preferences" },
  { path: "documents", label: "Documents" },
  { path: "review", label: "Review" },
] as const;

export function ApplyLayout() {
  const location = useLocation();
  const currentPath = location.pathname.split("/").pop();
  const currentIndex = APPLY_STEPS.findIndex((s) => s.path === currentPath);

  return (
    <AppShell>
      <nav aria-label="Application progress" className="step-rail">
        {APPLY_STEPS.map((step, index) => {
          const status = index < currentIndex ? "is-completed" : index === currentIndex ? "is-current" : "";
          return (
            <div key={step.path} className={`step-rail__item ${status}`}>
              <span className="step-rail__marker" aria-hidden="true">
                {index < currentIndex ? "✓" : index + 1}
              </span>
              <span className="step-rail__label">{step.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Compact fallback shown under 640px via CSS (see .step-rail--compact) */}
      <div className="step-rail--compact" role="status" aria-live="polite">
        <div className="step-rail__bar">
          <div
            className="step-rail__bar-fill"
            style={{ width: `${((currentIndex + 1) / APPLY_STEPS.length) * 100}%` }}
          />
        </div>
        <div className="step-rail__meta">
          <span>
            Step {currentIndex + 1} of {APPLY_STEPS.length}
          </span>
          <span>{APPLY_STEPS[currentIndex]?.label}</span>
        </div>
      </div>

      <Outlet />
    </AppShell>
  );
}