import type { ApiResponse } from "@/lib/api/types";
import { apiErrorMessage } from "@/lib/api/types";

export async function fetchApiData<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  const payload = (await res.json().catch(() => null)) as ApiResponse<T> | null;
  if (!res.ok || !payload || !payload.ok) {
    throw new Error(apiErrorMessage(payload));
  }
  return payload.data;
}
