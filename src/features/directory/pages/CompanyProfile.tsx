import { useEffect, useState } from "react"
import { safeWebsite } from "../services/profileSeo"
import CompanyLogo from "@/features/directory/components/CompanyLogo"
import PublicShell from "@/components/layout/PublicShell"
import type { View } from "@/types/View"
import directoryService, { normalizeStringArray} from "@/apiServices/directoryService"
import { PublicMember } from "@/types/PublicMember"

export default function CompanyProfile({
  go,
  member: initialMember,
  memberId,
}: {
  go: (v: View) => void
  member?: PublicMember | null
  memberId?: string
}) {
  const [member, setMember] = useState<PublicMember | null>(initialMember || null)
  const [loading, setLoading] = useState(Boolean(!initialMember && memberId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialMember && memberId) {
      setLoading(true)
      setError(null)
      void directoryService.show(memberId).then((res) => {
        if (res.success && res.data) {
          setMember(res.data)
        } else {
          setError(res.message || "Member profile not found.")
        }
        setLoading(false)
      })
    }
  }, [initialMember, memberId])

  if (loading) {
    return (
      <PublicShell go={go}>
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--muted)" }}>
          Loading company profile…
        </div>
      </PublicShell>
    )
  }

  if (error || !member) {
    return (
      <PublicShell go={go}>
        <div className="section" style={{ padding: "80px 20px", textAlign: "center" }}>
          <h2>Profile Unavailable</h2>
          <p>{error || "This organisation is not currently published in the member directory."}</p>
          <button className="btn btn-secondary" style={{ marginTop: "16px" }} onClick={() => go("directory")}>
            ← Return to Directory
          </button>
        </div>
      </PublicShell>
    )
  }

  const servicesList = normalizeStringArray(member.services)
  const coverageList = normalizeStringArray(member.coverage)
  const hasImage = Boolean(member.logo_url && !member.logo_url.toLowerCase().endsWith(".pdf"))

  return (
    <PublicShell go={go}>
      <section className={`company-profile-hero identity-card-${member.identity}`}>
        <div className="section">
          <button className="back-link" onClick={() => go("directory")}>
            ← Back to Our Members
          </button>
          <div className="company-profile-heading">
            <div className="member-logo-wrap large">
              {hasImage ? (
                <img
                  src={member.logo_url!}
                  alt={member.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    maxHeight: "120px",
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                    const sibling = e.currentTarget.nextElementSibling as HTMLElement | null
                    if (sibling) sibling.style.display = "flex"
                  }}
                />
              ) : null}
              <span style={{ display: hasImage ? "none" : "flex", width: "100%", height: "100%" }}>
                <CompanyLogo member={member} />
              </span>
            </div>
            <div>
              <span className="eyebrow">ISPAU member profile</span>
              <h1>{member.name}</h1>
              <p>{member.description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section company-profile-body">
        <article>
          <span className="eyebrow">Company introduction</span>
          <h2>About {member.name}</h2>
          <p>{member.description}</p>
          <div className="profile-ruled-list">
            <div>
              <span>Services offered</span>
              <strong>{servicesList.length ? servicesList.join(" · ") : "Internet Services"}</strong>
            </div>
            <div>
              <span>Regions served</span>
              <strong>{coverageList.length ? coverageList.join(" · ") : "Uganda"}</strong>
            </div>
          </div>
        </article>

        <aside className="public-contact-panel">
          <h2>Public business details</h2>
          <dl>
            {(member.city || member.district) && (
              <>
                <dt>Office location</dt>
                <dd>
                  {[member.city, member.district && `${member.district} District`].filter(Boolean).join(", ")}
                </dd>
              </>
            )}
            {member.website && (
              <>
                <dt>Official website</dt>
                <dd>
                  <a href={safeWebsite(member.website)} target="_blank" rel="noopener noreferrer">
                    {member.website}
                  </a>
                </dd>
              </>
            )}
            {member.email && (
              <>
                <dt>Business email</dt>
                <dd>
                  <a href={`mailto:${member.email}`}>{member.email}</a>
                </dd>
              </>
            )}
            {member.phone && (
              <>
                <dt>Business telephone</dt>
                <dd>
                  <a href={`tel:${member.phone.replace(/ /g, "")}`}>
                    {member.phone}
                  </a>
                </dd>
              </>
            )}
          </dl>
        </aside>
      </section>
    </PublicShell>
  )
}
