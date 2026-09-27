import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useOnboarding } from "../../state/OnboardingContext";

/**
 * Shared page chrome: navy header with wordmark + Help/My-Application-or-
 * Login nav, a width-constrained <main> slot, and a minimal footer.
 *
 * Reads userId from context to decide which nav to show, and owns the one
 * piece of real behavior here: Logout. Logging out clears all session/
 * applicant state via OnboardingContext.logout() and replaces the current
 * history entry with the public landing page, so the back button can't
 * step straight back into an authenticated view — ProtectedRoute would
 * redirect anyway, but this keeps the history itself clean too.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { userId, logout } = useOnboarding();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

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
              <>
                <Link to="/home">My Application</Link>
                <button type="button" className="app-header__logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
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