/**
 * Typed HTTP errors so route handlers can `throw` instead of writing
 * `reply.code(...).send(...)` everywhere, and the central error handler
 * converts them into a uniform JSON shape.
 */
export class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = "HttpError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, "bad_request", message, details);

export const notFound = (message = "not found") =>
  new HttpError(404, "not_found", message);

export const conflict = (message: string) =>
  new HttpError(409, "conflict", message);

export const serviceUnavailable = (message: string) =>
  new HttpError(503, "service_unavailable", message);

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
