export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "ApiError";
  }
}

interface ServerErrorBody {
  error?: { code?: string; message?: string };
}

async function parseError(res: Response): Promise<ApiError> {
  let code = "http_error";
  let message = res.statusText || `HTTP ${res.status}`;
  try {
    const text = await res.text();
    if (text) {
      try {
        const json = JSON.parse(text) as ServerErrorBody;
        if (json.error?.message) message = json.error.message;
        if (json.error?.code) code = json.error.code;
      } catch {
        // Body wasn't JSON; fall back to the raw text.
        message = text.slice(0, 200);
      }
    }
  } catch {
    // Reading the body failed; keep the defaults.
  }
  if (res.status === 0 || res.status >= 500) {
    return new ApiError(
      res.status,
      code,
      `${message} — API may be unreachable`,
    );
  }
  return new ApiError(res.status, code, message);
}

/**
 * Browser helper that hits the Next.js proxy at /api/proxy/*. Always returns
 * a typed `ApiError` on failure so callers can show useful messages.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `/api/proxy${path.startsWith("/") ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
      ...init,
    });
  } catch (err) {
    throw new ApiError(
      0,
      "network_error",
      err instanceof Error ? err.message : "network error",
    );
  }
  if (!res.ok) throw await parseError(res);
  return (await res.json()) as T;
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
}
