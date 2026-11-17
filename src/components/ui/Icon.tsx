import { icons } from "@/components/ui/icons"

export default function Icon({
  name,
  size = 20,
}: {
  name: string
  size?: number
}) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || icons.arrow}
    </svg>
  )
}
