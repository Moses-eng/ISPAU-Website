export default function downloadProforma() {
  const content = [
    "ISPAU NON-TAX PROFORMA INVOICE",
    "Reference: PF-2026-0018",
    "Organisation: Example Network Services Ltd",
    "Approved tier: Silver",
    "Amount: USD 500",
    "Membership period: 1 Apr 2026 – 31 Mar 2027",
    "This is not a tax invoice.",
  ].join("\n")
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }))
  const link = document.createElement("a")
  link.href = url
  link.download = "ISPAU-PF-2026-0018.txt"
  link.click()
  URL.revokeObjectURL(url)
}
