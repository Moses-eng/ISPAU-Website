export default function Field({
  label,
  placeholder,
  as = "input",
  options,
  hint,
  value,
  required = false,
  optional = false,
}: {
  label: string
  placeholder?: string
  as?: "input" | "select" | "textarea"
  options?: string[]
  hint?: string
  value?: string
  required?: boolean
  optional?: boolean
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {as === "select" ? (
        <select defaultValue="" required={required && !optional}>
          <option value="" disabled>
            {placeholder || "Select an option"}
          </option>
          {options?.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      ) : as === "textarea" ? (
        <textarea
          placeholder={placeholder}
          defaultValue={value}
          required={required && !optional}
        />
      ) : (
        <input
          placeholder={placeholder}
          defaultValue={value}
          required={required && !optional}
        />
      )}
      {hint && <small>{hint}</small>}
    </label>
  )
}
