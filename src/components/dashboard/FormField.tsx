import type { ReactNode } from "react"
export default function FormField({
  label,
  name,
  required = false,
  value,
  type = "text",
  options,
  multiline = false,
}: {
  label: string
  name: string
  required?: boolean
  value?: string | number
  type?: string
  options?: string[]
  multiline?: boolean
}) {
  let input: ReactNode
  const shared = {
    name,
    id: `workspace-${name}`,
    required,
    "aria-required": required,
    defaultValue: value,
  }
  if (options)
    input = (
      <select {...shared}>
        {!value && <option value="">Select…</option>}
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    )
  else if (multiline) input = <textarea {...shared} rows={4} />
  else
    input = (
      <input
        {...shared}
        type={type}
        min={type === "number" ? "0.01" : undefined}
        step={type === "number" ? "0.01" : undefined}
      />
    )
  return (
    <label className="field" htmlFor={shared.id}>
      <span>
        {label}
        {required && <b aria-hidden="true"> *</b>}
      </span>
      {input}
    </label>
  )
}
