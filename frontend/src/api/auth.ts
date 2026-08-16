// auth.ts
import { apiRequest } from "./client";
import type { LoginRequest, User } from "../types/onboarding";

/**
 * POST /login
 * identifier may be an email or a mobile number — the backend checks both.
 */
export async function login(payload: LoginRequest): Promise<User> {
  return apiRequest<User>("/login", {
    method: "POST",
    body: payload,
  });
}
