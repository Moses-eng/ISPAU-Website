import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import SectionTitle from "@/components/ui/SectionTitle"
import type { View } from "@/types/View"
import { heroSlides } from "@/features/public/data/heroSlides"

export default function About({ go }: { go: (v: View) => void }) {
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="About ISPAU"
        title="Working together for Uganda’s connected future."
        text="ISPAU is the trade association representing organisations that build, operate and secure Uganda’s internet, digital infrastructure and services."
        image={heroSlides[3]}
      />
      <section className="section two-col prose">
        <div>
          <SectionTitle
            eyebrow="Who we are"
            title="A forum for shared progress"
          />
          <p>
            Incorporated in 2018 as a company limited by guarantee, ISPAU
            convenes Uganda’s internet ecosystem around practical priorities and
            a stronger collective voice.
          </p>
          <p>
            Our role spans policy dialogue, technical collaboration, knowledge
            sharing and initiatives that support responsible industry growth.
          </p>
        </div>
        <div className="fact-panel">
          <span>Established</span>
          <strong>2018</strong>
          <span>Structure</span>
          <strong>Company limited by guarantee</strong>
          <span>Purpose</span>
          <strong>Member representation and collaboration</strong>
        </div>
      </section>
      <section className="soft-section">
        <div className="section">
          <SectionTitle
            eyebrow="Governance"
            title="Accountable leadership, focused working groups"
            text="Leadership content remains pending approved communication-pack material. The term below is retained for stakeholder context and is not presented as newly confirmed."
          />
          <div className="cards three">
            {[
              "Leadership — 2024–2026 term",
              "Secretariat",
              "NIPX — operationally independent",
            ].map((x, i) => (
              <article className="leadership-card" key={x}>
                <div className="portrait-placeholder">
                  {i === 0 ? (
                    "Leadership photograph"
                  ) : (
                    <Icon name={i === 1 ? "users" : "network"} />
                  )}
                </div>
                <h3>{x}</h3>
                <p>
                  {i === 2
                    ? "Referenced separately in governance; no participation workflow is implied."
                    : "Approved names, roles and organisation details to be supplied."}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <SectionTitle
          eyebrow="Working groups"
          title="Member expertise focused on practical issues"
        />
        <div className="pill-list">
          {[
            "Policy and regulation",
            "Infrastructure sharing",
            "Technical standards",
            "Membership and events",
          ].map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </section>
    </PublicShell>
  )
}
