import type { NavigationItem } from "@/components/layout/NavigationDropdown"
import type { View } from "@/types/View"

export const publicNavigation: { label: string; view: View }[] = [
  { label: "Home", view: "home" },
  { label: "About", view: "about" },
  { label: "Membership", view: "membership" },
  { label: "Services & Activities", view: "services" },
  { label: "Blog", view: "blog" },
  { label: "Contact", view: "contact" },
]

export const membershipNavigation: NavigationItem[] = [
  {
    label: "Membership",
    view: "membership",
    description: "Explore membership options",
    icon: "building",
  },
  {
    label: "Our Members",
    view: "directory",
    description: "Browse the member directory",
    icon: "account",
  },
]

export const accountNavigation: NavigationItem[] = [

  {
    label: "Log in",
    view: "login",
    description: "Open your organisation workspace",
    icon: "lock",
  },
  {
    label: "Resume Application",
    view: "login",
    description: "Continue the saved applicaion",
    icon: "building",
  },
]
