import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import type { View } from "@/types/View"
import { useState } from "react"

export default function EmailVerification({
  go,
  onVerified,
}: {
  go: (v: View) => void
  onVerified: () => void
}) {
  const [sent, setSent] = useState(true)
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Logo light />
        <span>Applicant account</span>
        <h1>Verify your work email to begin.</h1>
        <p>
          Your application progress is preserved through account verification.
        </p>
      </div>
      <main className="auth-form">
        <span className="eyebrow">Email verification</span>
        <h2>Check your email</h2>
        <p>
          A verification link preview was prepared for
          applicant@example-network.test.
        </p>
        {sent && (
          <div className="notice success">
            <Icon name="check" />
            <p>Verification message prepared. No real email was sent.</p>
          </div>
        )}
        <Button onClick={onVerified}>Use valid verification link</Button>
        <Button kind="secondary" onClick={() => setSent(true)}>
          Resend verification email
        </Button>
        <button
          className="text-link"
          onClick={() => go("verification-expired")}
        >
          View expired or invalid link state
        </button>
      </main>
    </div>
  )
}
