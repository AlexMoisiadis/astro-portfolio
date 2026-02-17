// lib/fetch-with-retry.ts

/** HTTP status codes that are considered transient and worth retrying. */
const RETRYABLE_STATUS_CODES = new Set([500, 502, 503, 504]);

interface FetchWithRetryOptions {
  /** Maximum number of attempts (including the initial one). Default: 3 */
  maxAttempts?: number;
  /** Base delay in ms before the first retry. Doubles each subsequent retry. Default: 1000 */
  baseDelayMs?: number;
}

/**
 * A drop-in replacement for `fetch` that automatically retries on transient
 * errors (network failures and 5xx status codes) with exponential backoff.
 */
export async function fetchWithRetry(
  input: string | URL | Request,
  init?: RequestInit,
  options?: FetchWithRetryOptions,
): Promise<Response> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const baseDelayMs = options?.baseDelayMs ?? 1000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(input, init);

      // If the response is not a retryable server error, return it immediately
      // (includes all 2xx, 3xx, and 4xx responses).
      if (!RETRYABLE_STATUS_CODES.has(res.status)) {
        return res;
      }

      // On the last attempt, return whatever we got rather than retrying.
      if (attempt === maxAttempts) {
        return res;
      }

      // Consume the body so the connection can be reused.
      await res.text().catch(() => {});

      console.warn(
        `[fetchWithRetry] Attempt ${attempt}/${maxAttempts} got HTTP ${res.status} — retrying in ${baseDelayMs * 2 ** (attempt - 1)}ms`,
      );
    } catch (err) {
      // Network error (DNS failure, connection refused, timeout, etc.)
      lastError = err;

      if (attempt === maxAttempts) {
        throw err;
      }

      console.warn(
        `[fetchWithRetry] Attempt ${attempt}/${maxAttempts} threw — retrying in ${baseDelayMs * 2 ** (attempt - 1)}ms`,
        err,
      );
    }

    // Exponential backoff: 1s, 2s, ...
    await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** (attempt - 1)));
  }

  // Should never reach here, but just in case:
  throw lastError ?? new Error('fetchWithRetry: all attempts exhausted');
}
