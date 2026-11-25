
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
  registered_address?: string;
  attachments?: {
    publicLogo?: string | null;
  };
}
