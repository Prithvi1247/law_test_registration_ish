import { useState } from "react";

export function PaymentInstructions() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: "var(--space-5)" }}>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide Payment Instructions" : "View Payment Instructions"}
      </button>
      {open && (
        <div className="alert alert-info" style={{ marginTop: "var(--space-3)" }}>
          <div>
            <p style={{ fontWeight: 600, color: "var(--color-ink-800)" }}>
              Payment can be made using any of the following methods:
            </p>
            <ul>
              <li>BillDesk Payment Gateway</li>
              <li>Easebuzz Payment Gateway</li>
              <li>Demand Draft</li>
            </ul>
            <p style={{ marginBottom: "var(--space-1)" }}>Test registration fee: INR 2,550 per test.</p>
            <p style={{ marginBottom: 0 }}>Programme registration fee: INR 1,000.</p>
          </div>
        </div>
      )}
    </div>
  );
}