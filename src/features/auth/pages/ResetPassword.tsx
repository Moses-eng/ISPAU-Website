import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Logo from "@/components/layout/Logo"
import RequiredText from "@/features/membership/components/RequiredText"
import type { View } from "@/types/View"
import { useState } from "react"

export default function ResetPassword({ go }: { go: (v: View) => void }) {
  const [complete, setComplete] = useState(false)
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Logo light />
        <span>Account recovery</span>
        <h1>Choose a new password.</h1>
      </div>
      <main className="auth-form">
        {complete ? (
          <>
            <h2>Password updated</h2>
            <p>Use the new password to sign in.</p>
            <Button onClick={() => go("login")}>Return to sign in</Button>
          </>
        ) : (
          <>
            <span className="eyebrow">Valid reset link</span>
            <h2>Set new password</h2>
            <RequiredText />
            <Field label="New password" required />
            <Field label="Confirm new password" required />
            <Button onClick={() => setComplete(true)}>Update password</Button>
          </>
        )}
      </main>
    </div>
  )
}
