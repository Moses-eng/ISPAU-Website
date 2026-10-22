import Button from "@/components/ui/Button"
import { ENABLE_TRADE_CREDIT } from "@/features/trade-credit/feature"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import type { View } from "@/types/View"
import { heroSlides } from "@/features/public/data/heroSlides"

export default function Services({ go }: { go: (v: View) => void }) {
  const items = [
    "Policy and regulatory engagement",
    "Infrastructure sharing",
    "Cybersecurity and resilience",
    "Training and certification activities",
    "Peering and internet exchange discussions",
    ...(ENABLE_TRADE_CREDIT ? ["Trade Credit and Payment Assurance"] : []),
  ]
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Services & activities"
        title="Practical programmes for a stronger internet industry."
        text="Explore ISPAU’s work in technical skills, policy dialogue, infrastructure collaboration and member support."
        image={heroSlides[1]}
      >
        <Button onClick={() => go("apply")}>Request Membership</Button>
      </PageHero>
      <section className="section">
        <div className="filter-row">
          <button className="active">All programmes</button>
          <button>Technical</button>
          <button>Policy</button>
          <button>Member services</button>
        </div>
        <div className="cards three">
          {items.map((x, i) => (
            <article className="service-card" key={x}>
              <span className="icon-box">
                <Icon
                  name={
                    ["users", "network", "shield", "book", "network", "chart"][
                      i
                    ]
                  }
                />
              </span>
              <h3>{x}</h3>
              <p>
                {i === 5
                  ? "Confidential payment information services for authorised participating members."
                  : "Focused collaboration, shared expertise and practical resources for ISPAU members."}
              </p>
              <button
                className="text-link"
                onClick={() => i === 5 && go("trade")}
              >
                {i === 5 ? "Read public service information" : "View programme"}{" "}
                <Icon name="arrow" size={16} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  )
}
