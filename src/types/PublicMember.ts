// export type PublicMember = {
//   isPreview?: boolean
//   id: string
//   name: string
//   initials: string
//   logoSrc: string
//   identity:
//     | "mtn"
//     | "airtel"
//     | "lyca"
//     | "liquid"
//     | "safaricom"
//     | "starlink"
//     | "independent"
//   description: string
//   city: string
//   district: string
//   services: string[]
//   coverage: string[]
//   website: string
//   email?: string
//   phone?: string
// }

export interface PublicMember {
  id: string;
  name: string;
  legal_name?: string;
  description: string;
  services: string[];
  coverage: string[];
  city?: string;
  district?: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  identity?: string;
  logo_url?: string | null;
  logoSrc?: string | null;
  initials?: string;
  attachments?: {
    publicLogo?: string | null;
  };
}
