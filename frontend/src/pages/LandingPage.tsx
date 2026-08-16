import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import "./LandingPage.css";

export function LandingPage() {
  return (
    <AppShell>
      <section className="hero">
        <p className="hero__eyebrow">Official Admission Portal</p>
        <h1>Begin your SLAT admission application</h1>
        <p>
          Register, complete your application in six guided steps, and track your submission and
          payment — all in one place.
        </p>
        <div className="hero__actions">
          <Link to="/register">
            <button type="button" className="btn btn-primary">
              New Applicant — Register
            </button>
          </Link>
          <Link to="/login">
            <button type="button" className="btn btn-secondary">
              Already Registered — Log In
            </button>
          </Link>
        </div>
      </section>

      <div className="info-grid">
        <article className="info-card">
          <span className="info-card__index" aria-hidden="true">1</span>
          <h3>Complete your application</h3>
          <p>
            Fill in your personal, education, and test preference details across a short, guided
            six-step form. You can save your progress and return anytime before submitting.
          </p>
        </article>
        <article className="info-card">
          <span className="info-card__index" aria-hidden="true">2</span>
          <h3>Choose your test date & centre</h3>
          <p>
            Select from the available test dates and rank your preferred test centres in order of
            preference for each date you choose.
          </p>
        </article>
        <article className="info-card">
          <span className="info-card__index" aria-hidden="true">3</span>
          <h3>Submit & pay securely</h3>
          <p>
            Review your complete application before submitting. Once submitted, your application is
            locked and you'll be guided to the payment dashboard.
          </p>
        </article>
      </div>

      <section className="key-dates">
        <h2>Before you begin</h2>
        <ul className="key-dates__list">
          <li className="key-dates__item">
            <span className="key-dates__label">Documents needed</span>
            <span className="key-dates__value">Recent passport-style photo (JPG/PNG, under 2 MB)</span>
          </li>
          <li className="key-dates__item">
            <span className="key-dates__label">Registration fee</span>
            <span className="key-dates__value">Confirmed at payment, after submission</span>
          </li>
          <li className="key-dates__item">
            <span className="key-dates__label">Test dates & centres</span>
            <span className="key-dates__value">Shown live during Step 3 of the application</span>
          </li>
        </ul>
      </section>
    </AppShell>
  );
}