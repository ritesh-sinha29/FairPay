import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.interval(
  "Remove expired sign-in requests",
  { minutes: 10 },
  internal.wallets.removeExpired,
);
export default crons;
