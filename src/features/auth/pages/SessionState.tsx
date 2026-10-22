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
    "signed-out": [
      "You’re signed out.",
      "Your session has ended. Public pages remain available.",
    ],
    expired: [
      "Your session has expired.",
      "Sign in again before accessing private organisation or staff information.",
    ],
    denied: [
      "Access denied.",
      "This account does not have permission to open the requested record or function.",
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
        Restricted routes cannot be opened by entering their address. Real
        authorisation must be enforced by the backend.
      </small>
    </div>
  )
}
