import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin"'
    }
  });
}

export function middleware(request: NextRequest) {
  const required = process.env.ADMIN_BASIC_AUTH;
  if (!required) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) {
    return unauthorized();
  }

  const decoded = globalThis.atob(authorization.slice("Basic ".length));
  if (decoded !== required) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};

