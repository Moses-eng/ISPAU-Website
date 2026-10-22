import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { queue } from "@/features/administration/data/queue"

export default function Staff({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Applications" role="Membership coordinator">
      <PortalHeading
        title="Membership Workspace"
        text="Review applications, resolve missing information and keep admissions moving."
      />
      <div className="stats">
        {[
          ["8", "New submissions", "+3 this week"],
          ["3", "Clarification responses", "Needs attention"],
          ["5", "Awaiting decision", "2 over 5 days"],
          ["4", "Approved awaiting payment", "USD 2,500 total"],
        ].map(([a, b, c], i) => (
          <div className="stat" key={b}>
            <span>{b}</span>
            <strong>{a}</strong>
            <small className={i === 1 ? "warn" : ""}>{c}</small>
          </div>
        ))}
      </div>
      <section className="panel table-panel">
        <div className="table-tools">
          <div>
            <h3>Coordinated application queue</h3>
            <p>Saved view: My active applications</p>
          </div>
          <div className="button-row">
            <button className="filter">
              <Icon name="search" /> Search
            </button>
            <button className="filter">Filters · 2</button>
          </div>
        </div>
        <div className="data-table">
          <div className="tr th">
            <span>Organisation</span>
            <span>Reference</span>
            <span>Stage</span>
            <span>Age</span>
            <span>Reviewer</span>
            <span>Next action</span>
          </div>
          {queue.map((r, i) => (
            <button
              className="tr"
              key={r[1]}
              onClick={() => i === 0 && go("staff-review")}
            >
              {r.map((x, j) => (
                <span key={j}>
                  {j === 2 ? (
                    <Tag
                      tone={i === 0 ? "info" : i === 2 ? "warning" : "neutral"}
                    >
                      {x}
                    </Tag>
                  ) : j === 5 ? (
                    <b>{x} →</b>
                  ) : (
                    x
                  )}
                </span>
              ))}
            </button>
          ))}
        </div>
      </section>
      <section className="panel activation-queue">
        <div>
          <span className="eyebrow">Membership-team action</span>
          <h3>Activation remains a separate controlled step</h3>
          <p>
            Activation is available only after an authorised admission decision
            and Accounts confirmation of actual payment receipt.
          </p>
        </div>
        <div>
          <strong>Nile Edge Systems Ltd</strong>
          <small>Decision approved · Payment confirmed by Accounts</small>
        </div>
        <Button onClick={() => go("activation")}>Activate Membership</Button>
      </section>
    </Portal>
  )
}
