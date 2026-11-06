import {
  convexAuthNextjsMiddleware,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";
export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const publicRoute =
    request.nextUrl.pathname === "/sign-in" ||
    request.nextUrl.pathname === "/auth" ||
    request.nextUrl.pathname.startsWith("/sign-up");
  const authenticated = await convexAuth.isAuthenticated();
  if (publicRoute && authenticated)
    return nextjsMiddlewareRedirect(request, "/");
  if (!publicRoute && !authenticated) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set(
      "returnTo",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(url);
  }
});
export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
