import { useState } from "react";

export function PaymentInstructions() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: "1rem" }}>
      <button type="button" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide Payment Instructions" : "View Payment Instructions"}
      </button>
      {open && (
        <div style={{ marginTop: "0.75rem" }}>
          <p>Payment can be made using any of the following methods:</p>
          <ul>
            <li>BillDesk Payment Gateway</li>
            <li>Easebuzz Payment Gateway</li>
            <li>Demand Draft</li>
          </ul>
          <p>Test registration fee: INR 2550 per test.</p>
          <p>Programme registration fee: INR 1000.</p>
        </div>
      )}
    </div>
  );
}