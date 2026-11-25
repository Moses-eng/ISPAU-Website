import { useState } from "react"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import Dialog from "@/components/dashboard/Dialog"
import { ENABLE_TRADE_CREDIT } from "@/features/trade-credit/feature"
import type { View } from "@/types/View"
const programmes = [
  {
    id: "policy",
    image:
      "https://images.unsplash.com/photo-1573164574511-73c773193279?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    name: "Policy and regulatory engagement",
    category: "Policy",
    icon: "users",
    description: "A shared industry voice on policy and regulatory matters.",
    details:
      "ISPAU brings member perspectives together for industry consultations and policy discussions. Contact the Secretariat for current consultations and participation arrangements.",
  },
  {
    id: "infrastructure",
    image:
      "https://images.unsplash.com/photo-1763284710278-417ddaf2beb9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    name: "Infrastructure sharing",
    category: "Technical",
    icon: "network",
    description: "Practical collaboration on connectivity infrastructure.",
    details:
      "Members can discuss infrastructure sharing and operational collaboration through ISPAU. Specific opportunities and commercial terms are agreed by the participating organisations.",
  },
  {
    id: "security",
    image:
      "https://images.unsplash.com/photo-1629837093109-11325d6e7afd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    name: "Cybersecurity and resilience",
    category: "Technical",
    icon: "shield",
    description: "Exchange knowledge on secure and resilient networks.",
    details:
      "Industry discussions and knowledge sharing help members strengthen network security and resilience. Contact the Secretariat for upcoming activities and confirmed resources.",
  },
  {
    id: "training",
    image:
      "https://images.unsplash.com/photo-1629837093109-11325d6e7afd?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    name: "Training and certification activities",
    category: "Technical",
    icon: "book",
    description: "Develop technical knowledge and professional skills.",
    details:
      "ISPAU coordinates opportunities for technical learning and industry development. Dates, providers, eligibility and any fees are confirmed for each programme before registration.",
  },
  {
    id: "peering",
    image:
      "https://images.unsplash.com/photo-1594915440248-1e419eba6611?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    name: "Peering and internet exchange discussions",
    category: "Technical",
    icon: "network",
    description:
      "Connect with peers on interconnection and local traffic exchange.",
    details:
      "Participate in discussions about peering and internet exchange practices. These discussions do not represent automatic admission to an exchange or a commercial interconnection agreement.",
  },
  {
    id: "trade",
    image:
      "https://images.unsplash.com/photo-1573164574511-73c773193279?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=85&w=1400",
    name: "Trade Credit and Payment Assurance",
    category: "Member services",
    icon: "shield",
    description:
      "Private payment-reference support for verified ISPs with a current paid subscription.",
    details:
      "An eligible ISP submits a private complaint with supporting evidence. Super Admin or Membership Admin verifies it before a reference becomes available to other eligible ISPs through a logged, authorised customer search. Disputes are treated as contested claims. ISPAU does not publish a public defaulter list, and this service is not a guarantee of payment. Resolution and withdrawal must be recorded through the authorised private workflow.",
  },
]
export default function Services({ go }: { go: (view: View) => void }) {
  const [category, setCategory] = useState("All programmes"),
    [selected, setSelected] = useState("")
  const current = programmes.find((p) => p.id === selected)
  const rows = programmes.filter(
    (p) => category === "All programmes" || p.category === category,
  )
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Services & activities"
        title="Practical programmes for a stronger internet industry."
        text="Explore ISPAU’s work in technical skills, policy dialogue, infrastructure collaboration and member support."
        pageName="services"
      >
        <Button onClick={() => go("apply")}>Request Membership</Button>
      </PageHero>
      <section className="section">
        <div
          className="filter-row"
          role="group"
          aria-label="Programme category"
        >
          {["All programmes", "Technical", "Policy", "Member services"].map(
            (c) => (
              <button
                key={c}
                type="button"
                className={category === c ? "active" : ""}
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ),
          )}
        </div>
        <p role="status">
          {rows.length} programme{rows.length === 1 ? "" : "s"}
        </p>
        <div className="cards three">
          {rows.map((p) => (
            <article className="service-card" key={p.id}>
              <span className="icon-box">
                <Icon name={p.icon} />
              </span>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <button className="text-link" onClick={() => setSelected(p.id)}>
                View programme <Icon name="arrow" size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
      {current && (
        <Dialog
          title={current.name}
          programmeHeader={{
            image: current.image,
            description: current.description,
          }}
          onClose={() => setSelected("")}
        >
          <div className="programme-dialog-body">
            <p>{current.details}</p>
            <div className="button-row">
              {current.id === "trade" && ENABLE_TRADE_CREDIT ? (
                <Button onClick={() => go("trade")}>
                  Read public service information
                </Button>
              ) : (
                <Button onClick={() => go("contact")}>
                  Contact the Secretariat
                </Button>
              )}
              <Button kind="secondary" onClick={() => setSelected("")}>
                Back to programmes
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </PublicShell>
  )
}
