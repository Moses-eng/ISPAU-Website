import Tag from "@/components/ui/Tag"
export default function StatusBadge({ status }: { status: string }) {
  const tone = [
    "Active",
    "Confirmed",
    "Published",
    "Verified",
    "settled",
  ].includes(status)
    ? "success"
    : [
          "Declined",
          "Clarification needed",
          "disputed",
          "verified overdue",
        ].includes(status)
      ? "danger"
      : [
            "Draft",
            "Deferred",
            "Receipt submitted",
            "Decision pending",
            "under verification",
            "repayment arrangement",
          ].includes(status)
        ? "warning"
        : "info"
  return <Tag tone={tone}>{status}</Tag>
}
