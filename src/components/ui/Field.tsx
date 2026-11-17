import type React from "react"

export default function Field({
  label,
  placeholder,
  as = "input",
  options,
  hint,
  value,
  onChange,
  error,
  type = "text",
  required = false,
  optional = false,
}: {
  label: string
  placeholder?: string
  as?: "input" | "select" | "textarea"
  options?: string[]
  hint?: string
  value?: string
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void
  error?: string
  type?: string
  required?: boolean
  optional?: boolean
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {as === "select" ? (
        <select
          value={value ?? ""}
          onChange={onChange}
          required={required && !optional}
        >
          <option value="" disabled>
            {placeholder || "Select an option"}
          </option>
          {options?.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          required={required && !optional}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          required={required && !optional}
        />
      )}
      {error && <small style={{ color: "var(--danger)" }}>{error}</small>}
      {hint && !error && <small>{hint}</small>}
    </label>
  )
}
