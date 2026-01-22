import { AppError, ConfigError, NotFoundError, UpstreamError, asErrorMessage } from "@/lib/api/errors";

describe("api errors", () => {
  it("formats error messages", () => {
    expect(asErrorMessage(new Error("x"))).toBe("x");
    expect(asErrorMessage("nope")).toBe("Unknown error");
  });

  it("creates typed errors with defaults", () => {
    const notFound = new NotFoundError();
    expect(notFound).toBeInstanceOf(AppError);
    expect(notFound.status).toBe(404);
    expect(notFound.code).toBe("NOT_FOUND");
    expect(notFound.message).toBe("Not found");

    const config = new ConfigError("Missing env");
    expect(config.status).toBe(503);
    expect(config.code).toBe("MISCONFIGURED");
  });

  it("creates UpstreamError with default message", () => {
    const err = new UpstreamError({ service: "nocodb", status: 500 });
    expect(err.status).toBe(502);
    expect(err.code).toBe("UPSTREAM_ERROR");
    expect(err.message).toBe("Upstream service error");
    expect(err.service).toBe("nocodb");
    expect(err.upstreamStatus).toBe(500);
  });

  it("creates UpstreamError with custom message", () => {
    const err = new UpstreamError({ service: "loops", status: 429, message: "Rate limited" });
    expect(err.message).toBe("Rate limited");
  });
});
