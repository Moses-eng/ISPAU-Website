import type { Actor } from "@/features/membership/types/workspace"
import { demoStaff } from "@/config/workspace"
import Button from "@/components/ui/Button"

export default function DemoIdentity({
  onSelect,
}: {
  onSelect: (actor: Actor) => void
}) {
  return (
    <div className="workspace-identities">
      <p>Manage membership and association services.</p>
      {demoStaff.map((actor) => (
        <button
          className="workspace-identity"
          key={actor.id}
          onClick={() => onSelect(actor)}
        >
          <strong>ISPAU Admin</strong>
          <span>Association administration</span>
          <small>
            Membership · Directory · Billing · Trade Credit verification
          </small>
        </button>
      ))}
      <Button
        kind="ghost"
        onClick={() => {
          location.href = "/"
        }}
      >
        Return to public website
      </Button>
    </div>
  )
}
