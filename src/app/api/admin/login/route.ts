import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const required = process.env.ADMIN_BASIC_AUTH;

    if (!required) {
      return NextResponse.json({ error: "Admin auth not configured" }, { status: 500 });
    }

    const [expectedUser, expectedPass] = required.split(":");

    if (username === expectedUser && password === expectedPass) {
      const res = NextResponse.json({ success: true });
      res.cookies.set("admin_session", "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/"
      });
      return res;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete("admin_session");
  return res;
}
