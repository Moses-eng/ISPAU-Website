import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function MemberInvoices({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Invoices">
      <PortalHeading
        title="Membership Invoices & Payment History"
        text="Documents available to Example Network Services Ltd."
      />
      <section className="panel table-panel">
        <div className="data-table invoice-table">
          <div className="tr th">
            <span>Document</span>
            <span>Period</span>
            <span>Amount</span>
            <span>Payment</span>
            <span>Action</span>
          </div>
          {[
            [
              "Tax invoice TX-2026-0018",
              "2026/27",
              "USD 500",
              "Confirmed",
              "Download",
            ],
            ["Proforma PF-2026-0018", "2026/27", "USD 500", "Paid", "Download"],
            [
              "Renewal proforma",
              "2027/28",
              "Not issued",
              "Not due",
              "View renewal",
            ],
          ].map((row, index) => (
            <button
              className="tr"
              key={row[0]}
              onClick={() => index === 2 && go("renewal")}
            >
              {row.map((item, itemIndex) => (
                <span key={item}>
                  {itemIndex === 3 ? <Tag>{item}</Tag> : item}
                </span>
              ))}
            </button>
          ))}
        </div>
      </section>
    </Portal>
  )
}
