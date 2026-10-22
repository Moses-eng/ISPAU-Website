import type { ComponentPropsWithoutRef } from "react"
import Icon from "@/components/ui/Icon"

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  kind?: "primary" | "secondary" | "ghost" | "danger"
  icon?: string
}

export default function Button({
  children,
  kind = "primary",
  icon,
  type = "button",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button {...props} type={type} className={`btn btn-${kind} ${className}`}>
      {children}
      {icon && <Icon name={icon} size={17} />}
    </button>
  )
}
