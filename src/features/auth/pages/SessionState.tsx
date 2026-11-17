import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import type { View } from "@/types/View"

export default function SessionState({
  kind,
  go,
}: {
  kind: "signed-out" | "expired" | "denied"
  go: (v: View) => void
}) {
  const content = {
    "signed-out": ["You’re signed out.", "Sign in to continue."],
    expired: ["Your session has expired.", "Sign in again to continue."],
    denied: [
      "Access denied.",
      "You don’t have permission to view this content.",
    ],
  }[kind]
  return (
    <div className="state-page">
      <Logo />
      <span className="state-icon">
        <Icon name="lock" size={28} />
      </span>
      <h1>{content[0]}</h1>
      <p>{content[1]}</p>
      <div className="button-row">
        <Button onClick={() => go("login")}>Sign in</Button>
        <Button kind="secondary" onClick={() => go("home")}>
          Public website
        </Button>
      </div>
      <small>
        Contact the Secretariat if you need help accessing your account.
      </small>
    </div>
  )
}
