"use client";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { WorkspaceProvider } from "./workspace-provider";
import { AppShell } from "./app-shell";
export function Application({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const profile = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const publicRoute =
    path === "/web" ||
    path.startsWith("/web") ||
    path === "/" ||
    path.startsWith("/sign-up") ||
    path === "/sign-in" ||
    path === "/auth";
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !publicRoute)
      router.replace("/web");
  }, [isAuthenticated, isLoading, publicRoute, router, path]);
  if (publicRoute) return children;
  if (isLoading || !isAuthenticated || profile === undefined)
    return (
      <div className="auth-loading">
        <LoaderCircle className="animate-spin" size={22} />
        <p>Opening your workspace…</p>
      </div>
    );
  if (!profile)
    return (
      <div className="auth-loading">
        <h1>Your profile is unavailable</h1>
        <p>Sign out and sign in again to restore your account.</p>
        <a href="/sign-in">Go to sign in</a>
      </div>
    );
  return (
    <WorkspaceProvider key={profile._id} user={profile}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
