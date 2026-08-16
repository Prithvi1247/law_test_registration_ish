import { apiRequest } from "./client";
import type { SendOtpResponse, User } from "../types/onboarding";

export async function sendOtp(userId: number): Promise<SendOtpResponse> {
  return apiRequest<SendOtpResponse>("/users/send-otp", {
    method: "POST",
    body: { user_id: userId },
  });
}

export async function verifyOtp(userId: number, otp: string): Promise<User> {
  return apiRequest<User>("/users/verify-otp", {
    method: "POST",
    body: { user_id: userId, otp },
  });
}