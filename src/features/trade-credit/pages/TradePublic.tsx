import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import SectionTitle from "@/components/ui/SectionTitle"
import type { View } from "@/types/View"

export default function TradePublic({ go }: { go: (v: View) => void }) {
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Trade Credit & Payment Assurance"
        title="Better payment information. Fairer resolution."
        text="The ISPAU Trade Credit and Payment Assurance Service helps participating members verify business payment records, resolve outstanding accounts and request confidential references for legitimate credit decisions."
      >
        <Button onClick={() => go("login")}>Member Service Sign In</Button>
        <Button kind="secondary" onClick={() => go("record-request")}>
          Request My Record
        </Button>
        <button className="text-link" onClick={() => go("dispute")}>
          Dispute or Appeal a Record
        </button>
      </PageHero>
      <section className="section">
        <SectionTitle
          eyebrow="How it works"
          title="A careful process, not a public blacklist"
        />
        <div className="steps five">
          {[
            "Submit",
            "Verify",
            "Notify and resolve",
            "Share eligible references",
            "Update after payment",
          ].map((x, i) => (
            <div className="step compact" key={x}>
              <span>{i + 1}</span>
              <h3>{x}</h3>
            </div>
          ))}
        </div>
        <div className="notice">
          <Icon name="shield" />
          <p>
            <strong>Each provider makes its own commercial decision.</strong> A
            reported claim is reviewed before it becomes eligible for sharing.
          </p>
        </div>
      </section>
      <section className="soft-section">
        <div className="section two-col">
          <div>
            <SectionTitle
              eyebrow="Scope"
              title="Business connectivity and infrastructure accounts"
            />
            <p>
              The service covers contracted business connectivity, wholesale
              bandwidth and shared-infrastructure invoices.
            </p>
          </div>
          <div className="clarity-card">
            <h3>What this service does not provide</h3>
            <ul className="check-list muted">
              <li>No public blacklist</li>
              <li>No numeric credit score</li>
              <li>No payment certificate or guarantee</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="section service-assurance">
        <div>
          <span className="eyebrow">Customer notice & privacy</span>
          <h2>Your information is handled through a controlled request.</h2>
          <p>
            Entering a name, email address or company number does not reveal a
            record. ISPAU first verifies the requester’s identity and authority.
            The final verification method remains subject to confirmation.
          </p>
        </div>
        <div className="assurance-actions">
          <Button onClick={() => go("record-request")}>
            Request My Record
          </Button>
          <Button kind="secondary" onClick={() => go("dispute")}>
            Dispute or Appeal a Record
          </Button>
          <p>
            Secretariat: <a href="mailto:info@ispau.ug">info@ispau.ug</a> · +256
            781 492 412
          </p>
        </div>
      </section>
    </PublicShell>
  )
}
