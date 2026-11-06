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
    pathname.startsWith("/api") ||
    isAuthPage;

  const authenticated = await convexAuth.isAuthenticated();

  // If already authenticated and on sign-in/sign-up, redirect to app
  if (isAuthPage && authenticated)
    return nextjsMiddlewareRedirect(request, "/jobs");

  // If not authenticated and trying to access a protected app page, redirect to /web
  if (!publicRoute && !authenticated) {
    return NextResponse.redirect(new URL("/web", request.url));
  }
});
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
