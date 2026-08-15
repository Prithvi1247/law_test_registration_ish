import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div>
      <h1>Admission Application Portal</h1>
      <p>Apply for admission online, track your application, and manage your submission.</p>
      <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
        <Link to="/register">
          <button type="button">New Applicant — Register</button>
        </Link>
        <Link to="/login">
          <button type="button">Already Registered — Log In</button>
        </Link>
      </div>
    </div>
  );
}
