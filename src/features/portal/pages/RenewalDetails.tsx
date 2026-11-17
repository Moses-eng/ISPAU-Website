import type { Actor, Application } from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import Button from "@/components/ui/Button"
import { useState } from "react"
import Dialog from "@/components/dashboard/Dialog"
import { membershipService } from "@/services/membershipService"
export default function RenewalDetails({
  application: a,
  actor,
  feedback,
  navigate,
}: {
  application: Application
  actor: Actor
  feedback: (message: string, error?: boolean) => void
  navigate: (route: string) => void
}) {
  const [confirmRenew, setConfirmRenew] = useState(false)
  return (
    <>
      <PageHeader
        title="Confirm renewal details"
        description="Reuse your organisation information; you do not need a new membership application."
      />
      <section className="workspace-panel">
        <h2>{a.organisation}</h2>
        <p>
          Recorded membership period: {a.periodStart} to {a.periodEnd}.
        </p>
        <p>
          {a.renewalConfirmedAt
            ? `Details confirmed ${new Date(a.renewalConfirmedAt).toLocaleDateString("en-GB")}.`
            : "Review your organisation and representatives before confirming."}
        </p>
        <div className="workspace-actions">
          <Button kind="secondary" onClick={() => navigate("organisation")}>
            Review organisation details
          </Button>
          <Button onClick={() => setConfirmRenew(true)}>
            Confirm renewal details
          </Button>
        </div>
        <p>
          Confirmation does not extend your membership period or create a
          payment. Approved renewal rules and fees will be supplied by ISPAU.
        </p>
      </section>
      {confirmRenew && (
        <Dialog
          title="Confirm renewal details?"
          onClose={() => setConfirmRenew(false)}
        >
          <p>
            I have reviewed the existing organisation and representative details
            for {a.organisation}.
          </p>
          <Button
            onClick={() => {
              membershipService.dispatch(actor, { type: "renew", id: a.id })
              feedback(
                "Renewal details confirmed. No new membership period or payment was created.",
              )
              setConfirmRenew(false)
            }}
          >
            Confirm details are accurate
          </Button>
        </Dialog>
      )}
    </>
  )
}
