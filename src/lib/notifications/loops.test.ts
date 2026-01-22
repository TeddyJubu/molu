import { UpstreamError } from "@/lib/api/errors";
import { sendLoopsTransactionalEmail } from "@/lib/notifications/loops";

describe("sendLoopsTransactionalEmail", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("does nothing when LOOPS_API_KEY is missing", async () => {
    process.env = { ...originalEnv, LOOPS_API_KEY: "" };
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await sendLoopsTransactionalEmail({
      email: "a@b.com",
      transactionalId: "tx_1",
      dataVariables: { orderId: "ORD-1" }
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls Loops transactional send endpoint with headers and payload", async () => {
    process.env = { ...originalEnv, LOOPS_API_KEY: "k" };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await sendLoopsTransactionalEmail({
      email: "a@b.com",
      transactionalId: "tx_1",
      idempotencyKey: "idemp-1",
      dataVariables: { orderId: "ORD-1" }
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://app.loops.so/api/v1/transactional/send",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer k",
          "content-type": "application/json",
          "Idempotency-Key": "idemp-1"
        })
      })
    );
  });

  it("treats 409 conflicts as success for idempotency", async () => {
    process.env = { ...originalEnv, LOOPS_API_KEY: "k" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 409 }));

    await expect(
      sendLoopsTransactionalEmail({
        email: "a@b.com",
        transactionalId: "tx_1",
        idempotencyKey: "idemp-1",
        dataVariables: { orderId: "ORD-1" }
      })
    ).resolves.toBeUndefined();
  });

  it("throws UpstreamError on non-409 failures", async () => {
    process.env = { ...originalEnv, LOOPS_API_KEY: "k" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    await expect(
      sendLoopsTransactionalEmail({
        email: "a@b.com",
        transactionalId: "tx_1",
        dataVariables: { orderId: "ORD-1" }
      })
    ).rejects.toBeInstanceOf(UpstreamError);
  });
});
