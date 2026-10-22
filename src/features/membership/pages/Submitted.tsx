import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"

export default function Submitted({ go }: { go: (v: View) => void }) {
  return (
    <div className="success-page">
      <Logo />
      <div className="success-icon">
        <Icon name="check" size={32} />
      </div>
      <Tag tone="success">Submission complete</Tag>
      <h1>Your application has been received.</h1>
      <p>
        Your reference is <strong>ISPAU-APP-2026-0018</strong>. An
        acknowledgement has been prepared. Email delivery to the verified
        applicant and membership@ispau.ug requires the production email
        integration.
      </p>
      <div className="reference-box">
        <span>Application reference</span>
        <strong>ISPAU-APP-2026-0018</strong>
        <small>Sample data</small>
      </div>
      <div className="button-row">
        <Button onClick={() => go("applicant")}>View Application</Button>
        <Button kind="secondary" onClick={() => go("home")}>
          Return to Website
        </Button>
      </div>
    </div>
  )
}
