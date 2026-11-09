/// <reference types="vite/client" />

declare module "virtual:ispau-directory" {
  export const profiles: import("./types/PublicMember").PublicMember[]
  export const configured: boolean
  export const indexable: boolean
  export const origin: string
}
