import { apiRequest } from "./client";
import type { PaymentDashboard, PaymentMethod, Payment } from "../types/onboarding";

export async function getPaymentDashboard(applicantId: number): Promise<PaymentDashboard> {
  return apiRequest<PaymentDashboard>(`/applicants/${applicantId}/payment`);
}

export async function initiatePayment(applicantId: number, method: PaymentMethod): Promise<Payment> {
  return apiRequest<Payment>(`/applicants/${applicantId}/payment`, {
    method: "POST",
    body: { payment_method: method },
  });
}