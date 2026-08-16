import { useEffect, useState } from "react";
import { getPaymentDashboard, initiatePayment } from "../api/payment";
import { ApiError, NetworkError } from "../api/client";
import { useOnboarding } from "../state/OnboardingContext";
import { PaymentInstructions } from "../components/PaymentInstructions";
import type { PaymentDashboard as PaymentDashboardType, PaymentMethod } from "../types/onboarding";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  BILLDESK: "BillDesk",
  EASEBUZZ: "Easebuzz",
  DEMAND_DRAFT: "Demand Draft",
};

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

  if (applicantId === null) return <p className="form-error">No application found for this session.</p>;
  if (isLoading) return <p>Loading payment information…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!dashboard) return null;

  return (
    <div>
      <h2>Payment Dashboard</h2>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Applicant Summary</h3>
        <p>Registration ID: {dashboard.registration_id ?? "Not yet assigned"}</p>
        <p>Name: {dashboard.full_name}</p>
        <p>Email: {dashboard.email}</p>
        <p>Category: {dashboard.category}</p>
        <p>Date of Birth: {dashboard.date_of_birth}</p>
        <p>Test Date(s): {dashboard.test_dates.map((td) => td.test_name).join(", ") || "None"}</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Amount Payable</h3>
        <p>Programme registration fee: INR {dashboard.programme_registration_fee}</p>
        <p>Total amount payable: INR {dashboard.amount_payable}</p>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Payment Transactions</h3>
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>S.No.</th><th>Item</th><th>Charges</th><th>Amount to Pay</th>
              <th>Payment Status</th><th>Payment Mode</th><th>Payment Date</th><th>Reference/Transaction ID</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.test_dates.map((td, i) => (
              <tr key={td.test_date_id}>
                <td>{i + 1}</td>
                <td>{td.test_name}</td>
                <td>INR {td.charges}</td>
                <td>INR {dashboard.amount_payable}</td>
                <td>{dashboard.payment?.payment_status ?? "Not Paid"}</td>
                <td>{dashboard.payment?.payment_method ? METHOD_LABELS[dashboard.payment.payment_method] : "—"}</td>
                <td>{dashboard.payment ? new Date(dashboard.payment.updated_at).toLocaleDateString() : "—"}</td>
                <td>{dashboard.payment?.reference_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginBottom: "1.5rem" }}>
        <h3>Select Payment Method</h3>
        {dashboard.available_payment_methods.map((method) => (
          <label key={method} style={{ display: "block", marginBottom: "0.5rem" }}>
            <input
              type="radio"
              name="payment_method"
              checked={selectedMethod === method}
              onChange={() => setSelectedMethod(method)}
              disabled={dashboard.payment?.payment_status === "SUCCESS"}
            />
            {METHOD_LABELS[method]}
          </label>
        ))}

        <button
          type="button"
          onClick={handleInitiate}
          disabled={!selectedMethod || isInitiating || dashboard.payment?.payment_status === "SUCCESS"}
        >
          {isInitiating ? "Starting payment…" : "Proceed to Pay"}
        </button>

        {dashboard.payment?.payment_status === "PENDING" && (
          <p style={{ marginTop: "0.5rem" }}>
            Payment initiated with {METHOD_LABELS[dashboard.payment.payment_method as PaymentMethod]}. Real
            gateway processing is not yet integrated — this stays PENDING until that's connected.
          </p>
        )}
      </section>

      <PaymentInstructions />
    </div>
  );
}