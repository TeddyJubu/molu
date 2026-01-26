import { z } from "zod";
import { ConfigError, InvalidJsonError } from "@/lib/api/errors";
import { fail, failFromError, ok } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const required = process.env.ADMIN_BASIC_AUTH;

    if (!required) {
      throw new ConfigError("Admin auth not configured. Set ADMIN_BASIC_AUTH.");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new InvalidJsonError();
    }

    const parsed = z
      .object({
        username: z.string().min(1),
        password: z.string().min(1)
      })
      .safeParse(body);

    if (!parsed.success) {
      throw parsed.error;
    }

    const [expectedUser, expectedPass] = required.split(":");

    if (parsed.data.username === expectedUser && parsed.data.password === expectedPass) {
      const res = ok({ success: true });
      res.cookies.set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/"
      });
      return res;
    }

    return fail(401, "UNAUTHORIZED", "Invalid credentials");
  } catch (error) {
    return failFromError(error);
  }
}

export async function DELETE() {
  const res = ok({ success: true });
  res.cookies.delete("admin_session");
  return res;
}
