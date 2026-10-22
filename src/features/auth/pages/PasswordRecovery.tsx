import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import RequiredText from "@/features/membership/components/RequiredText"
import type { View } from "@/types/View"
import { useState } from "react"

export default function PasswordRecovery({ go }: { go: (v: View) => void }) {
  const [sent, setSent] = useState(false)
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Logo light />
        <span>Account recovery</span>
        <h1>Reset access securely.</h1>
      </div>
      <main className="auth-form">
        <span className="eyebrow">Forgotten password</span>
        <h2>Request a reset link</h2>
        <RequiredText />
        <Field label="Verified work email" required />
        <Button onClick={() => setSent(true)}>Send reset link</Button>
        {sent && (
          <div className="notice success">
            <Icon name="check" />
            <p>Reset request prepared. No real email was sent.</p>
          </div>
        )}
        <button className="text-link" onClick={() => go("reset-password")}>
          Use reset link preview
        </button>
      </main>
    </div>
  )
}
