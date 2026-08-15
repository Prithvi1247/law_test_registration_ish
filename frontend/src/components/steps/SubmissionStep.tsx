import { Link } from "react-router-dom";

/**
 * BACKEND GAP #2: there is no final-submission / status-transition
 * endpoint. The applicant's `status` is hardcoded to "draft" on creation
 * and nothing in the backend ever changes it. Per instructions, this does
 * NOT simulate a successful submission or fake a "submitted" state — it
 * clearly tells the user submission isn't available yet.
 */
export function SubmissionStep() {
  return (
    <div>
      <h2>Final Submission</h2>
      <p>
        Your application has been filled out and saved through Review. Final submission isn't available
        yet — the backend doesn't currently provide an endpoint to mark an application as submitted, so
        nothing changes here until that's added.
      </p>
      <p>
        You can still <Link to="/apply/review">go back to Review</Link> to check or edit your application.
      </p>
    </div>
  );
}
