import { Check, Circle, Clock3, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { JobStatus } from "@/lib/jobs";
export function StatusBadge({
  status,
  acceptedAt,
}: {
  status: JobStatus;
  acceptedAt?: number;
}) {
  const Icon =
    status === "Paid"
      ? Check
      : status === "Submitted"
        ? Clock3
        : status === "Draft"
          ? FileText
          : Circle;
  return (
    <Badge variant="outline" className={`status-label ${status.toLowerCase()}`}>
      <Icon size={11} />
      {status === "Draft"
        ? acceptedAt
          ? "Deal agreed"
          : "Awaiting agreement"
        : status === "Submitted"
          ? "In review"
          : status}
    </Badge>
  );
}
