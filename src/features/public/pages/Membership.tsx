import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import SectionTitle from "@/components/ui/SectionTitle"
import type { View } from "@/types/View"
import { heroSlides } from "@/features/public/data/heroSlides"
import { tierService, type PublicTier } from "@/apiServices/tierService"
const formatFee = (cost: number): string => {return `USD ${cost}/year`}

export default function Membership({ go }: { go: (v: View) => void }) {
    const [tiers, setTiers] = useState<PublicTier[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
      let cancelled = false

      ;(async () => {
        setLoading(true)
        const res = await tierService.listPublic()
        if (cancelled) return

        if (res.success && res.data) {
          setTiers(res.data)
          setError(null)
        } else {
          setTiers([])
          setError(res.message)
        }
        setLoading(false)
      })()

      return () => {
        cancelled = true
      }
    }, [])

    // Featured card: keep the previous visual rule — the second tier.
    const featuredIndex = tiers.length > 1 ? 1 : -1
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Membership"
        title="Membership that connects your organisation to the industry."
        text="Explore the available tiers, prepare your documents and apply online. ISPAU reviews each application, confirms the appropriate tier and communicates the admission decision."
        image={heroSlides[2]}
      >
        <Button onClick={() => go("apply")}>Apply Now</Button>
        <Button kind="secondary" onClick={() => go("login")}>
          Resume Application
        </Button>
        <button className="text-link" onClick={() => go("member")}>
          Already a member? Update your details
        </button>
      </PageHero>
      <section className="section">
        <SectionTitle
          eyebrow="Membership tiers"
          title="A place for every part of the ecosystem"
          text="Annual fee baseline. Fees and tier boundaries are configurable by ISPAU."
        />

        {loading && (
          <div className="cards four">
            {Array.from({ length: 4 }).map((_, i) => (
              <article className="tier-card" key={i} aria-hidden>
                <div style={{ height: 24, width: "60%", background: "#e5e7eb", borderRadius: 6 }} />
                <div style={{ height: 32, width: "45%", background: "#e5e7eb", borderRadius: 6, marginTop: 16 }} />
                <div style={{ height: 16, width: "90%", background: "#e5e7eb", borderRadius: 6, marginTop: 16 }} />
                <div style={{ height: 16, width: "75%", background: "#e5e7eb", borderRadius: 6, marginTop: 8 }} />
              </article>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="notice">
            <Icon name="shield" />
            <p>
              <strong>Unable to load tiers.</strong> {error}
            </p>
          </div>
        )}

        {!loading && !error && tiers.length === 0 && (
          <div className="notice">
            <Icon name="shield" />
            <p>
              <strong>No tiers published yet.</strong> Please check back shortly.
            </p>
          </div>
        )}

        {!loading && !error && tiers.length > 0 && (
          <div className="cards four">
            {tiers.map((tier, i) => (
              <article
                className={`tier-card ${i === featuredIndex ? "featured" : ""}`}
                key={tier.id}
              >
                {i === featuredIndex && (
                  <span className="recommended">Common for emerging ISPs</span>
                )}
                <h3>{tier.name}</h3>
                <strong className="price">{formatFee(tier.cost)}</strong>
                <p>{tier.description}</p>
                <Button
                  kind={i === featuredIndex ? "primary" : "secondary"}
                  onClick={() => go("apply")}
                >
                  Choose {tier.name}
                </Button>
              </article>
            ))}
          </div>
        )}

        <div className="notice">
          <Icon name="shield" />
          <p>
            <strong>Tier and rights are confirmed during review.</strong> ISPAU
            confirms eligibility, the final tier and applicable rights. Paying a
            higher fee does not automatically grant governance rights.
          </p>
        </div>
      </section>

      <section className="soft-section">
        <div className="section">
          <SectionTitle
            eyebrow="How to join"
            title="From application to activation"
          />
          <div className="steps">
            {[
              [
                "Apply",
                "Submit your organisation’s details and supporting documents.",
              ],
              [
                "Verification",
                "The membership team checks the information and requests clarification if needed.",
              ],
              [
                "Decision",
                "An authorised decision maker confirms the outcome and approved tier.",
              ],
              [
                "Payment",
                "Receive your proforma invoice and pay using the supplied instructions.",
              ],
              [
                "Activation",
                "Once payment receipt is confirmed, receive your member ID and welcome notice.",
              ],
            ].map(([a, b], i) => (
              <div className="step" key={a}>
                <span>{i + 1}</span>
                <h3>{a}</h3>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="soft-section">
        <div className="section">
          <SectionTitle
            eyebrow="How to join"
            title="From application to activation"
          />
          <div className="steps">
            {[
              [
                "Apply",
                "Submit your organisation’s details and supporting documents.",
              ],
              [
                "Verification",
                "The membership team checks the information and requests clarification if needed.",
              ],
              [
                "Decision",
                "An authorised decision maker confirms the outcome and approved tier.",
              ],
              [
                "Payment",
                "Receive your proforma invoice and pay using the supplied instructions.",
              ],
              [
                "Activation",
                "Once payment receipt is confirmed, receive your member ID and welcome notice.",
              ],
            ].map(([a, b], i) => (
              <div className="step" key={a}>
                <span>{i + 1}</span>
                <h3>{a}</h3>
                <p>{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section two-col">
        <div>
          <SectionTitle
            eyebrow="Prepare to apply"
            title="Documents you may need"
            text="Requirements depend on your organisation’s activities. Where appropriate, you can select ‘Not applicable’ and explain."
          />
          <ul className="check-list">
            {[
              "Registration or establishment evidence",
              "Relevant licences or authorisations",
              "Evidence of authority to apply",
              "PDPO evidence where registered",
            ].map((x) => (
              <li key={x}>
                <Icon name="check" size={17} />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <aside className="clarity-card">
          <Icon name="shield" size={28} />
          <h3>Membership is not regulatory certification.</h3>
          <p>
            Admission confirms participation in the association. It does not
            replace licences, authorisations or regulatory obligations.
          </p>
          <Button onClick={() => go("apply")}>Start your application</Button>
        </aside>
      </section>
    </PublicShell>
  )
}
