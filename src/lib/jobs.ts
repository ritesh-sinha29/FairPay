import type { Id } from "../../convex/_generated/dataModel";
export type JobStatus = "Draft" | "Funded" | "Submitted" | "Paid";
export type Role = "client" | "freelancer";
export interface Profile {
  _id: Id<"users">;
  name: string;
  role: Role;
  walletAddress: string;
  headline: string;
}
export interface Job {
  id: Id<"jobs">;
  title: string;
  description: string;
  client: string;
  freelancer: string;
  clientName: string;
  freelancerName: string;
  amount: string;
  amountWei: string;
  paymentAsset?: string;
  paymentTokenAddress?: string;
  tokenDecimals?: number;
  status: JobStatus;
  acceptedAt?: number;
  createdAt: string;
  updatedAt: string;
  chainId: number;
  contractAddress?: string;
  fundingHash?: string;
  fundingReservation?: string;
  reservationExpiresAt?: number;
  deliverableUrl?: string;
  submissionNote?: string;
  verifiedAt?: number;
}
export const STATUS_ORDER: JobStatus[] = [
  "Draft",
  "Funded",
  "Submitted",
  "Paid",
];
export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
export function jobUrl(job: Job) {
  return `/jobs/${job.id}`;
}
