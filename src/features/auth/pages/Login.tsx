import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import RequiredText from "@/features/membership/components/RequiredText"
import type { View } from "@/types/View"

export default function Login({
  go,
  onSignIn,
}: {
  go: (v: View) => void
  onSignIn: () => void
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
        <span className="eyebrow">Secure sign in</span>
        <h2>Welcome back</h2>
        <p>Use the verified work email associated with your organisation.</p>
        <RequiredText />
        <Field label="Work email" placeholder="name@organisation.ug" required />
        <Field label="Password" placeholder="Enter your password" required />
        <Button onClick={onSignIn}>Sign in to workspace</Button>
        <button className="text-link" onClick={() => go("forgot-password")}>
          Forgot password?
        </button>
        <div className="auth-note">
          <Icon name="shield" />
          <p>
            Front-end authentication preview. Production access to records and
            files must be enforced by the backend.
          </p>
        </div>
        <button className="staff-entry" onClick={() => go("staff-login")}>
          ISPAU staff sign in
        </button>
      </main>
    </div>
  )
}
