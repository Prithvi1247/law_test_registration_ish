import { Outlet, useLocation } from "react-router-dom";

const APPLY_STEPS = [
  { path: "personal", label: "Personal Details" },
  { path: "education", label: "Education" },
  { path: "test", label: "Test Date" },
  { path: "preferences", label: "Test Centre Preferences" },
  { path: "documents", label: "Photo / Documents" },
  { path: "review", label: "Review" },
] as const;

export function ApplyLayout() {
  const location = useLocation();
  const currentPath = location.pathname.split("/").pop();
  const currentIndex = APPLY_STEPS.findIndex((s) => s.path === currentPath);

  return (
    <div>
      <nav aria-label="Application progress" style={{ marginBottom: "1.5rem" }}>
        <ol style={{ display: "flex", gap: "0.5rem", listStyle: "none", padding: 0, flexWrap: "wrap" }}>
          {APPLY_STEPS.map((step, index) => (
            <li
              key={step.path}
              style={{
                fontSize: "0.85rem",
                color: index === currentIndex ? "#1a1a1a" : "#888",
                fontWeight: index === currentIndex ? 600 : 400,
              }}
            >
              {index + 1}. {step.label}
              {index < APPLY_STEPS.length - 1 && <span style={{ margin: "0 0.5rem" }}>→</span>}
            </li>
          ))}
        </ol>
      </nav>
      <Outlet />
    </div>
  );
}
