export type AppErrorOptions = {
  code: string;
  status: number;
  message: string;
  details?: unknown;
};

export class AppError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}

export class InvalidJsonError extends AppError {
  constructor() {
    super({ code: "INVALID_JSON", status: 400, message: "Invalid JSON" });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found", details?: unknown) {
    super({ code: "NOT_FOUND", status: 404, message, details });
  }
}

export class ConfigError extends AppError {
  constructor(message: string, details?: unknown) {
    super({ code: "MISCONFIGURED", status: 503, message, details });
  }
}

export class UpstreamError extends AppError {
  service: string;
  upstreamStatus?: number;

  constructor(options: { service: string; status: number; message?: string; details?: unknown }) {
    super({
      code: "UPSTREAM_ERROR",
      status: 502,
      message: options.message ?? "Upstream service error",
      details: options.details
    });
    this.service = options.service;
    this.upstreamStatus = options.status;
  }
}

export function asErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}
