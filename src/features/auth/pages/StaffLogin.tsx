import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import RequiredText from "@/features/membership/components/RequiredText"
import type { View } from "@/types/View"

export default function StaffLogin({
  go,
  onContinue,
}: {
  go: (v: View) => void
  onContinue: () => void
}) {
  return (
    <div className="auth-page staff-auth">
      <div className="auth-brand">
        <Logo light />
        <span>Restricted staff access</span>
        <h1>Role-scoped access for authorised ISPAU staff.</h1>
        <p>Staff accounts open only the functions assigned to that account.</p>
        <button onClick={() => go("home")}>← Return to public website</button>
      </div>
      <main className="auth-form">
        <span className="eyebrow">Staff authentication</span>
        <h2>Sign in</h2>
        <RequiredText />
        <Field label="Staff email" placeholder="name@ispau.ug" required />
        <Field label="Password" placeholder="Enter your password" required />
        <Button onClick={onContinue}>Continue to MFA</Button>
        <div className="auth-note">
          <Icon name="lock" />
          <p>
            This front-end shows the MFA journey; it does not implement
            production authentication.
          </p>
        </div>
      </main>
    </div>
  )
}
