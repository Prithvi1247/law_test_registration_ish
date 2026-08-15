import { apiRequest } from "./client";
import type { RegisterRequest, User } from "../types/onboarding";

/**
 * POST /users
 */
export async function createUser(payload: RegisterRequest): Promise<User> {
  return apiRequest<User>("/users", {
    method: "POST",
    body: payload,
  });
}
