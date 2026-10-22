import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import SectionTitle from "@/components/ui/SectionTitle"
import type { View } from "@/types/View"
import { heroSlides } from "@/features/public/data/heroSlides"
import { tiers } from "@/features/public/data/tiers"

export default function Membership({ go }: { go: (v: View) => void }) {
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Membership"
        title="Membership that connects your organisation to the industry."
        text="Explore the available tiers, prepare your documents and apply online. ISPAU reviews each application, confirms the appropriate tier and communicates the admission decision."
        image={heroSlides[2]}
      >
        <Button onClick={() => go("apply")}>Apply Now</Button>
        <Button kind="secondary" onClick={() => go("applicant")}>
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
        <div className="cards four">
          {tiers.map(([name, fee, text], i) => (
            <article
              className={`tier-card ${i === 1 ? "featured" : ""}`}
              key={name}
            >
              {i === 1 && (
                <span className="recommended">Common for emerging ISPs</span>
              )}
              <h3>{name}</h3>
              <strong className="price">{fee}</strong>
              <p>{text}</p>
              <Button
                kind={i === 1 ? "primary" : "secondary"}
                onClick={() => go("apply")}
              >
                Choose {name}
              </Button>
            </article>
          ))}
        </div>
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
