import { AuthForm } from "@/components/auth-form";
import { AuthScreen } from "@/components/auth-screen";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const isSignUp = params?.mode === "signup" || params?.mode === "signUp";

  return (
    <AuthScreen>
      <AuthForm mode={isSignUp ? "signUp" : "signIn"} />
    </AuthScreen>
  );
}
