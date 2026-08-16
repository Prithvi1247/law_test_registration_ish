import { useEffect, useState } from "react";
import { getPaymentDashboard, initiatePayment } from "../api/payment";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";
import { PaymentInstructions } from "../components/PaymentInstructions";
import { AppShell } from "../components/layout/AppShell";
import type { PaymentDashboard as PaymentDashboardType, PaymentMethod } from "../types/onboarding";
import "./PaymentDashboard.css";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  BILLDESK: "BillDesk",
  EASEBUZZ: "Easebuzz",
  DEMAND_DRAFT: "Demand Draft",
};

function StatusPill({ status }: { status: string }) {
  if (status === "SUCCESS") return <span className="status-pill status-pill--success">Success</span>;
  if (status === "PENDING") return <span className="status-pill status-pill--pending">Pending</span>;
  if (status === "FAILED") return <span className="status-pill status-pill--pending">Failed</span>;
  return <span className="status-pill status-pill--not-paid">{status}</span>;
}

export function PaymentDashboard() {
  const { applicantId } = useOnboarding();

  const [dashboard, setDashboard] = useState<PaymentDashboardType | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | "">("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitiating, setIsInitiating] = useState(false);

  useEffect(() => {
    if (applicantId === null) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  function load() {
    if (applicantId === null) return;
    setIsLoading(true);
    getPaymentDashboard(applicantId)
      .then((data) => {
        setDashboard(data);
        if (data.payment?.payment_method) setSelectedMethod(data.payment.payment_method);
      })
      .catch((err) => {
        if (err instanceof ApiError || err instanceof NetworkError) setError(err.message);
        else setError("Could not load payment information.");
      })
      .finally(() => setIsLoading(false));
  }

  async function handleInitiate() {
    if (applicantId === null || !selectedMethod) return;
    setError(null);
    setIsInitiating(true);
    try {
      await initiatePayment(applicantId, selectedMethod);
      load();
    } catch (err) {
      if (err instanceof ApiError || err instanceof NetworkError) setError(err.message);
      else setError("Something went wrong while starting the payment.");
    } finally {
      setIsInitiating(false);
    }
  }

  if (applicantId === null)
    return (
      <AppShell>
        <div className="content-card">
          <p className="form-error" role="alert">No application found for this session.</p>
        </div>
      </AppShell>
    );
  if (isLoading) return <AppShell><div className="content-card"><p>Loading payment information…</p></div></AppShell>;
  if (error) return <AppShell><div className="content-card"><p className="form-error" role="alert">{error}</p></div></AppShell>;
  if (!dashboard) return null;

  const isPaid = dashboard.payment?.payment_status === "SUCCESS";

  return (
    <AppShell>
      <div className="content-card">
        <p className="content-card__eyebrow">Fee Payment</p>
        <h2 className="content-card__title">Payment Dashboard</h2>
        <p className="content-card__description">
          Review your application summary and complete your registration payment below.
        </p>

        <div className="form-section">
          <h3 className="form-section__title">Applicant Summary</h3>
          <dl className="payment-summary">
            <div className="review-row">
              <dt>Registration ID</dt>
              <dd>{dashboard.registration_id ?? "Not yet assigned"}</dd>
            </div>
            <div className="review-row">
              <dt>Name</dt>
              <dd>{dashboard.full_name}</dd>
            </div>
            <div className="review-row">
              <dt>Email</dt>
              <dd>{dashboard.email}</dd>
            </div>
            <div className="review-row">
              <dt>Category</dt>
              <dd>{dashboard.category}</dd>
            </div>
            <div className="review-row">
              <dt>Date of Birth</dt>
              <dd>{dashboard.date_of_birth}</dd>
            </div>
            <div className="review-row">
              <dt>Test Date(s)</dt>
              <dd>{dashboard.test_dates.map((td) => td.test_name).join(", ") || "None"}</dd>
            </div>
          </dl>
        </div>

        <div className="form-section">
          <h3 className="form-section__title">Fee Breakdown</h3>
          <div className="fee-table-wrap">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Item</th>
                  <th>Charges</th>
                  <th>Amount to Pay</th>
                  <th>Payment Status</th>
                  <th>Payment Mode</th>
                  <th>Payment Date</th>
                  <th>Reference / Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.test_dates.map((td, i) => (
                  <tr key={td.test_date_id}>
                    <td>{i + 1}</td>
                    <td>{td.test_name}</td>
                    <td>₹{td.charges}</td>
                    <td>₹{dashboard.amount_payable}</td>
                    <td><StatusPill status={dashboard.payment?.payment_status ?? "Not Paid"} /></td>
                    <td>{dashboard.payment?.payment_method ? METHOD_LABELS[dashboard.payment.payment_method] : "—"}</td>
                    <td>{dashboard.payment ? new Date(dashboard.payment.updated_at).toLocaleDateString() : "—"}</td>
                    <td>{dashboard.payment?.reference_id ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="amount-banner">
          <div>
            <div className="amount-banner__label">Programme registration fee: ₹{dashboard.programme_registration_fee}</div>
            <div className="amount-banner__label" style={{ marginTop: "0.2rem" }}>Total Amount Payable</div>
          </div>
          <div className="amount-banner__value">₹{dashboard.amount_payable}</div>
        </div>

        <div className="form-section">
          <h3 className="form-section__title">Select Payment Method</h3>
          <div className="payment-method-list" role="radiogroup" aria-label="Payment method">
            {dashboard.available_payment_methods.map((method) => (
              <label
                key={method}
                className={`payment-method-option${selectedMethod === method ? " is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  checked={selectedMethod === method}
                  onChange={() => setSelectedMethod(method)}
                  disabled={isPaid}
                />
                <span className="payment-method-option__label">{METHOD_LABELS[method]}</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleInitiate}
            disabled={!selectedMethod || isInitiating || isPaid}
          >
            {isInitiating ? "Starting payment…" : "Proceed to Payment"}
          </button>

          {dashboard.payment?.payment_status === "PENDING" && (
            <div className="alert alert-info" style={{ marginTop: "var(--space-4)" }}>
              <p style={{ margin: 0 }}>
                Payment initiated with {METHOD_LABELS[dashboard.payment.payment_method as PaymentMethod]}. Real
                gateway processing is not yet integrated — this stays Pending until that's connected.
              </p>
            </div>
          )}

          {error && <p className="form-error" role="alert" style={{ marginTop: "var(--space-4)" }}>{error}</p>}
        </div>

        <PaymentInstructions />
      </div>
    </AppShell>
  );
}