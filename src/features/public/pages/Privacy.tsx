import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import type { View } from "@/types/View"

export default function Privacy({ go }: { go: (v: View) => void }) {
  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Privacy notice"
        title="How membership information is handled."
        text="How ISPAU handles membership information and public-profile choices."
      />
      <section className="section narrow prose">
        <h2>Membership applications</h2>
        <p>
          Application answers and evidence are private and available only to
          authorised users for membership processing, decisions, invoicing and
          administration.
        </p>
        <h2>Public directory information</h2>
        <p>
          Directory publication is separate from admission and requires
          eligibility, approval and current publication permission.
        </p>
        <h2>Production controls</h2>
        <p>
          Real authentication, server-enforced permissions, private document
          storage, scanning, retention and backup controls require backend
          implementation and verification.
        </p>
        <p>
          Questions: <a href="mailto:info@ispau.ug">info@ispau.ug</a>
        </p>
      </section>
    </PublicShell>
  )
}
