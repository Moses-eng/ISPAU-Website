import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { tcRows } from "@/features/trade-credit/data/tcRows"

export default function TradeDashboard({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Trade Credit" role="ISP member user">
      <PortalHeading
        title="Trade Credit Workspace"
        text="Authorised access for Example Network Services Ltd"
        action={
          <>
            <Button kind="secondary" onClick={() => go("reference")}>
              Request a Payment Reference
            </Button>
            <Button onClick={() => go("tc-submit")}>Submit a Record</Button>
          </>
        }
      />
      <div className="notice secure">
        <Icon name="shield" />
        <p>
          <strong>Confidential member service.</strong> Access is separately
          provisioned and all searches are logged. Each provider makes its own
          commercial decision.
        </p>
      </div>
      <div className="stats">
        {[
          ["2", "Open cases", "1 under verification"],
          ["3", "Information requests", "1 response due"],
          ["1", "Repayment arrangement", "Updated 15 Mar"],
          ["7", "Settled records", "Last 12 months"],
        ].map(([a, b, c]) => (
          <div className="stat" key={b}>
            <span>{b}</span>
            <strong>{a}</strong>
            <small>{c}</small>
          </div>
        ))}
      </div>
      <section className="panel table-panel">
        <div className="table-tools">
          <div>
            <h3>Your organisation’s records</h3>
            <p>Adverse records and repayment updates</p>
          </div>
          <div className="filter-row small">
            <button className="active">Open</button>
            <button>Settled</button>
            <button>Satisfactory references</button>
          </div>
        </div>
        <div className="data-table tc-table">
          <div className="tr th">
            <span>Business customer</span>
            <span>Reference</span>
            <span>Outstanding</span>
            <span>Status</span>
            <span>Last updated</span>
          </div>
          {tcRows.map((r, i) => (
            <button
              className="tr"
              key={r[1]}
              onClick={() => i === 0 && go("tc-case")}
            >
              {r.map((x, j) => (
                <span key={j}>
                  {j === 3 ? (
                    <Tag
                      tone={i === 0 ? "info" : i === 1 ? "warning" : "success"}
                    >
                      {x}
                    </Tag>
                  ) : (
                    x
                  )}
                </span>
              ))}
            </button>
          ))}
        </div>
      </section>
    </Portal>
  )
}
