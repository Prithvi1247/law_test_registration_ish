// Minimal REST client wrapper.
// All backend calls go through here so error handling (network errors,
// 400/404/500, malformed JSON) is handled consistently in one place.
// client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export class NetworkError extends Error {
  constructor(message = "Network error — please check your connection and try again.") {
    super(message);
    this.name = "NetworkError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
}

/**
 * Extracts a human-readable message from a FastAPI-style error body.
 * FastAPI validation errors typically look like:
 *   { "detail": "Some message" }
 * or
 *   { "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }
 */
function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : null))
        .filter((m): m is string => Boolean(m));
      if (messages.length > 0) return messages.join(" ");
    }
  }
  return fallback;
}

export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  const { method = "GET", body, isFormData = false } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: isFormData ? undefined : { "Content-Type": "application/json" },
        // Guard against double-encoding: if a caller already passed a
        // JSON string (e.g. someone mistakenly did JSON.stringify(payload)
        // before calling apiRequest), don't stringify it again — that
        // would send Pydantic a quoted string instead of an object,
        // producing "Input should be a valid dictionary or object to
        // extract fields from". Objects are stringified exactly once,
        // here, and nowhere else.
        body: isFormData
          ? (body as FormData)
          : body === undefined
          ? undefined
          : typeof body === "string"
          ? body
          : JSON.stringify(body),
      });
  } catch {
    // fetch throws only on network-level failures (offline, DNS, CORS, etc.)
    throw new NetworkError();
  }

  let parsedBody: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = text;
    }
  }

  if (!response.ok) {
    const fallback =
      response.status === 404
        ? "The requested resource was not found."
        : response.status >= 500
        ? "The server ran into a problem. Please try again shortly."
        : "The request could not be completed.";
    throw new ApiError(extractErrorMessage(parsedBody, fallback), response.status, parsedBody);
  }

  return parsedBody as TResponse;
}
