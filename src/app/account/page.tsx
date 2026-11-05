"use client";
import { useWorkspace } from "@/components/workspace-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export default function AccountPage() {
  const { user } = useWorkspace();
  return (
    <div className="page-wrap max-w-3xl">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">YOUR PROFILE</p>
          <h1>
            Account details<span className="text-blue-400">.</span>
          </h1>
          <p className="page-description">
            Your role and wallet identify your account and its job permissions.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-7">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Account type</p>
            <Badge variant="outline" className="capitalize">
              {user.role}
            </Badge>
          </div>
          {user.headline && (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Professional headline
              </p>
              <p className="text-sm">{user.headline}</p>
            </div>
          )}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              Verified wallet
            </p>
            <p className="address-text">{user.walletAddress}</p>
          </div>
          <p className="text-xs leading-7 text-muted-foreground">
            Sign in with this wallet to access your jobs from another browser.
            Your wallet authorizes all escrow transactions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
