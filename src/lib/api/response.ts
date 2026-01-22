import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/api/errors";
import type { ApiFail, ApiOk } from "@/lib/api/types";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data } satisfies ApiOk<T>, init);
}

export function fail(status: number, code: string, message: string, details?: unknown) {
  const body: ApiFail = { ok: false, error: { code, message, ...(details === undefined ? {} : { details }) } };
  return NextResponse.json(body, { status });
}

export function failFromError(error: unknown) {
  if (error instanceof AppError) {
    return fail(error.status, error.code, error.message, error.details);
  }
  if (error instanceof ZodError) {
    return fail(422, "VALIDATION_ERROR", "Validation failed", error.issues);
  }
  return fail(500, "INTERNAL_ERROR", "Internal server error");
}
