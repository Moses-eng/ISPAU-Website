import type { MembershipApplicationValues } from "@/types/MembershipApplicationValues"

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
}: {
  name: string
  label: string
  values: MembershipApplicationValues
  errors: Record<string, string>
  setValue: (name: string, value: string) => void
  required?: boolean
  optional?: boolean
  as?: "input" | "select" | "textarea"
  options?: string[]
  placeholder?: string
}) {
  const id = `application-${name}`
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
          aria-describedby={errors[name] ? `${id}-error` : undefined}
        >
          <option value="">Select an option</option>
          {options?.map((option) => (
            <option key={option}>{option}</option>
          ))}
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
          aria-describedby={errors[name] ? `${id}-error` : undefined}
        />
      ) : (
        <input
          id={id}
          value={String(values[name] || "")}
          placeholder={placeholder}
          onChange={(event) => setValue(name, event.target.value)}
          required={required}
          aria-required={required}
          aria-invalid={Boolean(errors[name])}
          aria-describedby={errors[name] ? `${id}-error` : undefined}
        />
      )}
      {errors[name] && (
        <small className="inline-error" id={`${id}-error`}>
          {errors[name]}
        </small>
      )}
    </label>
  )
}
