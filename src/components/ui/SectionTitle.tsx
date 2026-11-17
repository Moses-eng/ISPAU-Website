import SectionAccent from "@/components/ui/SectionAccent"

export default function SectionTitle({
  eyebrow,
  title,
  text,
  align = "left",
}: {
  eyebrow?: string
  title: string
  text?: string
  align?: "left" | "center"
}) {
  return (
    <div className={`section-title ${align === "center" ? "center" : ""}`}>
      <SectionAccent align={align} />
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  )
}
