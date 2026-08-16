import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useOnboarding } from "../../state/OnboardingContext";

/**
 * Shared page chrome: navy header with wordmark + Help/Login-or-Profile
 * nav, a width-constrained <main> slot, and a minimal footer. Purely
 * presentational — reads userId from context only to decide which single
 * nav link to show, and does not redirect or gate anything itself
 * (ProtectedRoute still owns all access control).
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { userId } = useOnboarding();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="app-brand">
            <span className="app-brand__mark" aria-hidden="true">SL</span>
            <span>
              SLAT Admission
              <span className="app-brand__sub" style={{ display: "block" }}>
                2026 Application Portal
              </span>
            </span>
          </Link>
          <nav className="app-header__nav" aria-label="Account">
            <a href="#help">Help</a>
            {userId !== null ? (
              <Link to="/dashboard">My Application</Link>
            ) : (
              <Link to="/login">Log In</Link>
            )}
          </nav>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <footer className="app-footer">
        <p style={{ margin: 0 }}>
          © 2026 SLAT Admissions. All rights reserved. · <a href="#privacy">Privacy</a> ·{" "}
          <a href="#contact">Contact</a>
        </p>
      </footer>
    </div>
  );
}