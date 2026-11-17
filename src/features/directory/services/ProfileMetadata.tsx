import { useEffect } from "react"
import type { PublicMember } from "@/types/PublicMember"
import { profileMetadata, profilePath, jsonLd } from "./profileSeo"
import { origin, indexable } from "virtual:ispau-directory"
const baseTitle = "ISPAU | Internet Service Providers Association of Uganda"
export default function ProfileSeo({
  member,
  directory = false,
  unavailable = false,
}: {
  member?: PublicMember
  directory?: boolean
  unavailable?: boolean
}) {
  useEffect(() => {
    const metadata = member
      ? profileMetadata(member, origin)
      : {
          title: directory
            ? "Member ISP Directory | ISPAU"
            : unavailable
              ? "Profile unavailable | ISPAU"
              : baseTitle,
          description: directory
            ? "Explore the approved public company profiles of ISPAU member ISPs."
            : "Membership applications and management for the Internet Service Providers Association of Uganda.",
          canonical: directory && origin ? `${origin}/members/` : "",
          structuredData: undefined,
        }
    const canIndex =
      indexable &&
      (directory || Boolean(member && !member.isPreview)) &&
      !unavailable
    document.title = metadata.title
    const meta = (name: string, content: string, property = false) => {
      const attribute = property ? "property" : "name"
      let element = document.head.querySelector<HTMLMetaElement>(
        `meta[${attribute}="${name}"]`,
      )
      if (!element) {
        element = document.createElement("meta")
        element.setAttribute(attribute, name)
        document.head.append(element)
      }
      element.content = content
    }
    meta("description", metadata.description)
    meta("robots", canIndex ? "index, follow" : "noindex, nofollow")
    meta("og:title", metadata.title, true)
    meta("og:description", metadata.description, true)
    meta("og:type", "website", true)
    document.head
      .querySelectorAll(
        'link[rel="canonical"], meta[property="og:url"], script[type="application/ld+json"]',
      )
      .forEach((element) => element.remove())
    if (metadata.canonical) {
      const canonical = document.createElement("link")
      canonical.rel = "canonical"
      canonical.href = metadata.canonical
      document.head.append(canonical)
      meta("og:url", metadata.canonical, true)
    }
    if (metadata.structuredData) {
      const script = document.createElement("script")
      script.type = "application/ld+json"
      script.textContent = jsonLd(metadata.structuredData)
      document.head.append(script)
    }
    if (
      member &&
      (location.pathname !== profilePath(member) || location.hash)
    ) {
      history.replaceState(null, "", profilePath(member))
      dispatchEvent(new PopStateEvent("popstate"))
    }
    return () => {
      document.title = baseTitle
      meta("robots", "noindex, nofollow")
      document.head
        .querySelectorAll(
          'link[rel="canonical"], meta[property^="og:"], script[type="application/ld+json"]',
        )
        .forEach((element) => element.remove())
    }
  }, [member, directory, unavailable])
  return null
}
