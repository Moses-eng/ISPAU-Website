import { useEffect, useRef, useState } from "react"

export default function OtpInput({
  onComplete,
  disabled,
  error,
}: {
  onComplete: (code: string) => void
  disabled: boolean
  error: string
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  useEffect(() => {
    if (error && !disabled) inputs.current[0]?.focus()
  }, [error, disabled])
  const update = (index: number, value: string) => {
    const clean = value.replace(/[^0-9]/g, "").slice(0, 6)
    const start = clean.length === 6 ? 0 : index
    const next = [...digits]
    if (!clean) next[index] = ""
    else
      [...clean].forEach((digit, offset) => {
        if (start + offset < 6) next[start + offset] = digit
      })
    setDigits(next)
    if (clean) inputs.current[Math.min(start + clean.length, 5)]?.focus()
    if (next.every(Boolean)) onComplete(next.join(""))
  }
  return (
    <div className="field">
      <span id="otp-label">Verification code</span>
      <div
        className="otp-boxes"
        role="group"
        aria-labelledby="otp-label"
        aria-describedby={`code-help${error ? " code-error" : ""}`}
        aria-busy={disabled}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            autoFocus={index === 0}
            name={`otp-digit-${index + 1}`}
            aria-label={`Digit ${index + 1} of 6`}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "code-error" : undefined}
            disabled={disabled}
            value={digit}
            onFocus={(event) => event.target.select()}
            onChange={(event) => update(index, event.target.value)}
            onPaste={(event) => {
              event.preventDefault()
              update(index, event.clipboardData.getData("text"))
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digit && index > 0) {
                event.preventDefault()
                const next = [...digits]
                next[index - 1] = ""
                setDigits(next)
                inputs.current[index - 1]?.focus()
              }
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault()
                inputs.current[
                  Math.max(
                    0,
                    Math.min(5, index + (event.key === "ArrowLeft" ? -1 : 1)),
                  )
                ]?.focus()
              }
            }}
          />
        ))}
      </div>
    </div>
  )
}
