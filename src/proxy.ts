import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname === "/sign-in" ||
    pathname === "/auth" ||
    pathname.startsWith("/sign-up");
  const publicRoute =
    pathname === "/" ||
    pathname === "/web" ||
    pathname.startsWith("/web") ||
    pathname === "/arkiv" ||
    pathname.startsWith("/arkiv/") ||
    pathname === "/api/arkiv" ||
    pathname.startsWith("/api/arkiv") ||
    pathname === "/api/auth" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/blockscout") ||
    isAuthPage;

  const authenticated = await convexAuth.isAuthenticated();

  // If already authenticated and on sign-in/sign-up, redirect to app
  if (isAuthPage && authenticated)
    return nextjsMiddlewareRedirect(request, "/jobs");

  // If not authenticated and trying to access a protected app page or API
  if (!publicRoute && !authenticated) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/web", request.url));
  }
});
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
