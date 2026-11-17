export default function SectionAccent({
  align = "left",
  light = false,
}: {
  align?: "left" | "center"
  light?: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={`mb-5 block h-1.5 w-24 sm:h-2 sm:w-32 ${
        light ? "bg-brand-tint" : "bg-brand"
      } ${align === "center" ? "mx-auto" : ""}`}
    />
  )
}
