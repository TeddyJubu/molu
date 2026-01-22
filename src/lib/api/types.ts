export type ApiOk<T> = { ok: true; data: T };
export type ApiFail = { ok: false; error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiOk<T> | ApiFail;

export function apiErrorMessage(payload: unknown) {
  const message =
    typeof (payload as any)?.error?.message === "string"
      ? String((payload as any).error.message)
      : typeof (payload as any)?.error === "string"
        ? String((payload as any).error)
        : null;
  return message ?? "Request failed";
}
