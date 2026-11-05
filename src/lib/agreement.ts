import { keccak256, toUtf8Bytes } from "ethers";

/** Versioned canonical commitment to the persisted, immutable job terms. */
export function agreementHash(job: {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  clientAddress?: string;
  client?: string;
  freelancerAddress?: string;
  freelancer?: string;
  amountWei: string;
  chainId: number;
}) {
  return keccak256(
    toUtf8Bytes(
      JSON.stringify([
        "fairpay-agreement-v1",
        job._id ?? job.id,
        job.chainId,
        (job.clientAddress ?? job.client)!.toLowerCase(),
        (job.freelancerAddress ?? job.freelancer)!.toLowerCase(),
        job.title,
        job.description,
        job.amountWei,
      ]),
    ),
  );
}
