import Button from "@/components/ui/Button"

import Logo from "@/components/layout/Logo"
import type { View } from "@/types/View"

export default function Login({
  go,
  onSignIn,
  staffAccessEnabled = false,
}: {
  go: (v: View) => void
  onSignIn: () => void
  staffAccessEnabled?: boolean
}) {
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <Logo light />
        <span>Member and applicant access</span>
        <h1>Your organisation’s ISPAU workspace.</h1>
        <p>
          Continue an application or access membership services assigned to your
          organisation.
        </p>
        <button onClick={() => go("home")}>← Return to public website</button>
      </div>
      <main className="auth-form">
        <span className="eyebrow">Member access</span>
        <h2>Welcome back</h2>
        <p>Continue to your organisation’s workspace.</p>

        <Button onClick={onSignIn}>Open organisation workspace</Button>
        <button className="text-link" onClick={() => go("forgot-password")}>
          Forgot password?
        </button>
        {staffAccessEnabled && (
          <button className="staff-entry" onClick={() => go("staff-login")}>
            ISPAU staff sign in
          </button>
        )}
      </main>
    </div>
  )
}
