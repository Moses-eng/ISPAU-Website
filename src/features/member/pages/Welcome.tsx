import Button from "@/components/ui/Button"
import Logo from "@/components/layout/Logo"
import Portal from "@/components/layout/Portal"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function Welcome({ go }: { go: (v: View) => void }) {
  return (
    <Portal go={go} active="Membership">
      <div className="welcome-notice">
        <Logo />
        <Tag tone="success">Active membership</Tag>
        <h1>Welcome to ISPAU.</h1>
        <p>
          Example Network Services Ltd is active for the period 1 April 2026 to
          31 March 2027.
        </p>
        <div className="reference-box">
          <span>Stable member ID</span>
          <strong>ISPAU-M-0018</strong>
          <small>This identifier is retained at renewal.</small>
        </div>
        <Button onClick={() => go("member")}>Open Member Dashboard</Button>
      </div>
    </Portal>
  )
}
