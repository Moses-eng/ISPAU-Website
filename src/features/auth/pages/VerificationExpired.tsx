import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import type { View } from "@/types/View"

export default function VerificationExpired({ go }: { go: (v: View) => void }) {
  return (
    <div className="state-page">
      <Logo />
      <span className="state-icon">
        <Icon name="lock" size={28} />
      </span>
      <h1>Verification link expired or invalid.</h1>
      <p>
        Request a new link before opening the private membership application. No
        application answers have been lost.
      </p>
      <Button onClick={() => go("email-verify")}>
        Request New Verification Link
      </Button>
    </div>
  )
}
