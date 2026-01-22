import { UpstreamError } from "@/lib/api/errors";

export type LoopsTransactionalPayload = {
  email: string;
  transactionalId: string;
  dataVariables: Record<string, unknown>;
  addToAudience?: boolean;
  idempotencyKey?: string;
};

export function isLoopsConfigured() {
  return Boolean(process.env.LOOPS_API_KEY);
}

export async function sendLoopsTransactionalEmail(payload: LoopsTransactionalPayload) {
  const apiKey = process.env.LOOPS_API_KEY;
  if (!apiKey) return;

  const res = await fetch("https://app.loops.so/api/v1/transactional/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      ...(payload.idempotencyKey ? { "Idempotency-Key": payload.idempotencyKey } : {})
    },
    body: JSON.stringify({
      email: payload.email,
      transactionalId: payload.transactionalId,
      addToAudience: payload.addToAudience ?? true,
      dataVariables: payload.dataVariables
    })
  });

  if (res.status === 409) return;
  if (!res.ok) {
    throw new UpstreamError({ service: "loops", status: res.status });
  }
}
