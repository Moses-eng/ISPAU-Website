import { useState } from "react"
import type { Actor, Application } from "@/features/membership/types/workspace"
import Dialog from "@/components/dashboard/Dialog"
import Button from "@/components/ui/Button"
import FormField from "@/components/dashboard/FormField"
import { membershipService } from "@/services/membershipService"
export default function MemberAccess({
  application: a,
  actor,
  feedback,
}: {
  application: Application
  actor: Actor
  feedback: (text: string, error?: boolean) => void
}) {
  const [editing, setEditing] = useState(false),
    [error, setError] = useState("")
  const allowed = actor.kind === "staff" && actor.roles.includes("secretariat")
  return (
    <section className="workspace-panel">
      <h2>Trade Credit access</h2>
      <p>
        {a.tradeCreditAccess?.enabled
          ? "Provisioned by ISPAU"
          : "Not provisioned"}
        . Every eligible ISP receives the same tools; membership tier does not
        grant additional account authority.
      </p>
      {a.tradeCreditAccess && (
        <p>
          {a.tradeCreditAccess.actor} ·{" "}
          {new Date(a.tradeCreditAccess.date).toLocaleDateString()} ·{" "}
          {a.tradeCreditAccess.reason}
        </p>
      )}
      {allowed && (
        <Button kind="secondary" onClick={() => setEditing(true)}>
          {a.tradeCreditAccess?.enabled
            ? "Restrict Trade Credit access"
            : "Provision Trade Credit account"}
        </Button>
      )}
      {editing && (
        <Dialog
          title="Confirm Trade Credit access"
          onClose={() => setEditing(false)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault()
              try {
                membershipService.dispatch(actor, {
                  type: "trade-access",
                  id: a.id,
                  enabled: !a.tradeCreditAccess?.enabled,
                  reason: String(
                    new FormData(event.currentTarget).get("reason") || "",
                  ),
                })
                setEditing(false)
                feedback(
                  "Trade Credit access updated and recorded in the audit history.",
                )
              } catch (e) {
                setError((e as Error).message)
              }
            }}
          >
            <p>
              Only ISPAU can provision or restrict participation. Directory
              publication and membership standing remain separate.
            </p>
            {error && <p role="alert">{error}</p>}
            <FormField
              name="reason"
              label="Reason for access change"
              multiline
              required
            />
            <Button type="submit">Confirm access change</Button>
          </form>
        </Dialog>
      )}
    </section>
  )
}
