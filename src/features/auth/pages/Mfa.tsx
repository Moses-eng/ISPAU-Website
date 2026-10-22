import Button from "@/components/ui/Button"
import Field from "@/components/ui/Field"
import Icon from "@/components/ui/Icon"
import Logo from "@/components/layout/Logo"
import RequiredText from "@/features/membership/components/RequiredText"

export default function Mfa({ onVerify }: { onVerify: () => void }) {
  return (
    <div className="auth-page staff-auth">
      <div className="auth-brand">
        <Logo light />
        <span>Restricted staff access</span>
        <h1>Confirm it’s you.</h1>
        <p>MFA is required before any staff workspace becomes available.</p>
      </div>
      <main className="auth-form">
        <span className="eyebrow">Multi-factor authentication</span>
        <h2>Enter verification code</h2>
        <p>Enter the six-digit code from your authenticator application.</p>
        <RequiredText />
        <Field label="Verification code" placeholder="000 000" required />
        <Button onClick={onVerify}>Verify and continue</Button>
        <button className="text-link">Use another verification method</button>
        <div className="auth-note">
          <Icon name="shield" />
          <p>MFA interface preview only.</p>
        </div>
      </main>
    </div>
  )
}
