export type PublicMember = {
  id: string
  name: string
  initials: string
  logoSrc: string
  identity: "mtn" | "airtel" | "lyca" | "liquid" | "safaricom" | "starlink"
  description: string
  city: string
  district: string
  services: string[]
  coverage: string[]
  website: string
  email?: string
  phone?: string
}
