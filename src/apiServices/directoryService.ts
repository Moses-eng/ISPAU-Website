import axiosClient from "./axiosClient";
import { API_PUBLIC_DIRECTORY_LIST, API_PUBLIC_DIRECTORY_SHOW } from "./APIs";
import { BASE_URL } from "./env";
import type { PublicMember } from "@/types/PublicMember";

export interface DirectoryFilters {
  search?: string;
  service?: string;
  coverage?: string;
}

export interface ApiDirectoryListResponse {
  success: boolean;
  message: string;
  data: PublicMember[];
  total: number;
}

export interface ApiDirectorySingleResponse {
  success: boolean;
  message: string;
  data: PublicMember | null;
}

export function normalizeStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    if (val.trim().startsWith("[") && val.trim().endsWith("]")) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fall back to split
      }
    }
    return val
      .split(/[,·|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export const resolveLogoUrl = (m: any): string | null => {
  const logoPath = m.attachments?.publicLogo;
  if (!logoPath) return null;
  const logoUrl = BASE_URL+"/"+logoPath;
  return logoUrl;
};

const formatMember = (m: any): PublicMember => {
  const resolvedLogo = resolveLogoUrl(m);
  const initials = (m.name || m.legal_name || "IS")
    .split(" ")
    .filter(Boolean)
    .map((word: string) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return {
    id: m.id,
    name: m.name || m.legal_name || "Unnamed Member",
    legal_name: m.legal_name || "",
    description: m.description || "",
    services: normalizeStringArray(m.services),
    coverage: normalizeStringArray(m.coverage),
    city: m.city || "Kampala",
    district: m.district || "Central",
    registered_address:m.registered_address || "",
    website: m.website || null,
    email: m.email || null,
    phone: m.phone || null,
    identity: m.identity || String(m.id || "").slice(0, 8),
    logo_url: resolvedLogo,
    logoSrc: resolvedLogo,
    initials,
    attachments: {
      publicLogo: m.attachments?.publicLogo || null,
    },
  };
};

class DirectoryService {
  async list(filters: DirectoryFilters = {}): Promise<ApiDirectoryListResponse> {
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(
          ([, v]) => Boolean(v) && v !== "All services" && v !== "All coverage areas"
        )
      );

      const res = await axiosClient.get(API_PUBLIC_DIRECTORY_LIST, { params });
      const rawItems: any[] = res.data?.data?.items ?? [];
      const items: PublicMember[] = rawItems.map(formatMember);
      const total: number = res.data?.data?.total ?? items.length;

      return {
        success: res.data?.status === "success",
        message: res.data?.message ?? "Loaded directory.",
        data: items,
        total,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "Failed to load directory.",
        data: [],
        total: 0,
      };
    }
  }

  async show(id: string): Promise<ApiDirectorySingleResponse> {
    try {
      const res = await axiosClient.get(API_PUBLIC_DIRECTORY_SHOW(id));
      const raw = res.data?.data ?? null;

      return {
        success: res.data?.status === "success",
        message: res.data?.message ?? "Member loaded.",
        data: raw ? formatMember(raw) : null,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.response?.data?.message || "Failed to load member profile.",
        data: null,
      };
    }
  }
}

export const directoryService = new DirectoryService();
export default directoryService;
