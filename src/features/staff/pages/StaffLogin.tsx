import Button from "@/components/ui/Button"

import Logo from "@/components/layout/Logo"
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
        <span className="eyebrow">Staff access</span>
        <h2>Staff workspace</h2>

        <Button onClick={onContinue}>Open staff workspace</Button>
      </main>
    </div>
  )
}
