import type { MembershipApplicationValues } from "@/types/MembershipApplicationValues"

export type SelectOption = string | { label: string; value: string }

export default function ApplicationInput({
  name,
  label,
  values,
  errors,
  setValue,
  required = false,
  optional = false,
  as = "input",
  options,
  placeholder,
  hint,
}: {
  name: string
  label: string
  values: MembershipApplicationValues
  errors: Record<string, string>
  setValue: (name: string, value: string) => void
  required?: boolean
  optional?: boolean
  as?: "input" | "select" | "textarea"
  options?: SelectOption[]
  placeholder?: string
  hint?: string
}) {
  const id = `application-${name}`
  const describedBy = [hint ? `${id}-hint` : "", errors[name] ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined
  return (
    <label
      className={`field ${errors[name] ? "field-error" : ""}`}
      htmlFor={id}
    >
      <span>
        {label} {required && <b aria-hidden="true">*</b>}
        {optional && <em> (optional)</em>}
      </span>
      {as === "select" ? (
        <select
          id={id}
          value={String(values[name] || "")}
          onChange={(event) => setValue(name, event.target.value)}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={describedBy}
        >
          <option value="">Select an option</option>
          {options?.map((option) => {
            const val = typeof option === "string" ? option : option.value
            const text = typeof option === "string" ? option : option.label
            return (
              <option key={val} value={val}>
                {text}
              </option>
            )
          })}
        </select>
      ) : as === "textarea" ? (
        <textarea
          id={id}
          value={String(values[name] || "")}
          placeholder={placeholder}
          onChange={(event) => setValue(name, event.target.value)}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={describedBy}
        />
      ) : (
        <input
          id={id}
          type={name.toLowerCase().includes("email") ? "email" : "text"}
          inputMode={name === "ugandaAddress" ? "numeric" : undefined}
          pattern={name === "ugandaAddress" ? "[0-9]+" : undefined}
          autoComplete={name === "businessEmail" ? "email" : undefined}
          value={String(values[name] || "")}
          placeholder={placeholder}
          onChange={(event) => setValue(name, name === "ugandaAddress" ? event.target.value.replace(/[^0-9]/g, "") : event.target.value)}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={describedBy}
        />
      )}
      {hint && <small id={`${id}-hint`} className="helper">{hint}</small>}
      {errors[name] && (
        <small className="inline-error" id={`${id}-error`}>
          {errors[name]}
        </small>
      )}
    </label>
  )
}
