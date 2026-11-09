import {
  forwardRef,
  useId,
  useState,
  type ComponentPropsWithoutRef,
} from "react"
import Icon from "./Icon"

type PasswordFieldProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  label: string
}

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, id, disabled, ...props }, ref) {
    const generatedId = useId()
    const inputId = id || generatedId
    const [visible, setVisible] = useState(false)
    return (
      <div className="field">
        <label htmlFor={inputId}>{label}</label>
        <div className="password-control">
          <input
            {...props}
            id={inputId}
            ref={ref}
            type={visible ? "text" : "password"}
            disabled={disabled}
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={`${visible ? "Hide" : "Show"} ${label.replace(/\s*\*$/, "").toLowerCase()}`}
            aria-controls={inputId}
            aria-pressed={visible}
            disabled={disabled}
            onClick={() => setVisible((current) => !current)}
          >
            <Icon name={visible ? "eye-off" : "eye"} />
          </button>
        </div>
      </div>
    )
  },
)

export default PasswordField
