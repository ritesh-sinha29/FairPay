import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import {
  convexAuth,
  createAccount,
  retrieveAccount,
} from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    ConvexCredentials<DataModel>({
      id: "wallet",
      authorize: async (credentials, ctx): Promise<{ userId: Id<"users"> }> => {
        if (
          typeof credentials.challengeId !== "string" ||
          typeof credentials.signature !== "string"
        ) {
          throw new Error("A signed wallet challenge is required.");
        }
        const proof = await ctx.runAction(internal.walletActions.verify, {
          challengeId: credentials.challengeId as Id<"walletChallenges">,
          signature: credentials.signature,
        });
        if (proof.flow === "signUp") {
          if (!proof.role || !proof.name)
            throw new Error("Choose an account type and enter your name.");
          const { user } = await createAccount(ctx, {
            provider: "wallet",
            account: { id: proof.address },
            profile: {
              name: proof.name,
              role: proof.role,
              walletAddress: proof.address,
              headline: proof.headline ?? "",
            },
            shouldLinkViaEmail: false,
            shouldLinkViaPhone: false,
          });
          return { userId: user._id };
        }
        const account = await retrieveAccount(ctx, {
          provider: "wallet",
          account: { id: proof.address },
        });
        if (!account)
          throw new Error(
            "No FairPay account is linked to this wallet. Create an account first.",
          );
        return { userId: account.user._id };
      },
    }),
  ],
});
