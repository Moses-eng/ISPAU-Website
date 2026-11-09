import { safeWebsite } from "../services/profileSeo"
import CompanyLogo from "@/features/directory/components/CompanyLogo"
import Icon from "@/components/ui/Icon"
import type { PublicMember } from "@/types/PublicMember"
import PublicShell from "@/components/layout/PublicShell"
import type { View } from "@/types/View"

export default function CompanyProfile({
  go,
  member,
}: {
  go: (v: View) => void
  member: PublicMember
}) {
  return (
    <PublicShell go={go}>
      <section
        className={`company-profile-hero identity-card-${member.identity}`}
      >
        <div className="section">
          <button className="back-link" onClick={() => go("directory")}>
            ← Back to Our Members
          </button>
          <div className="company-profile-heading">
            <div className="member-logo-wrap large">
              <CompanyLogo member={member} />
            </div>
            <div>
              <span className="eyebrow">
                {member.isPreview
                  ? "Sample public company profile"
                  : "ISPAU member profile"}
              </span>
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
              <strong>{member.services.join(" · ")}</strong>
            </div>
            <div>
              <span>Regions served</span>
              <strong>{member.coverage.join(" · ")}</strong>
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
                  {[member.city, member.district].filter(Boolean).join(", ")}
                </dd>
              </>
            )}
            <dt>Official website</dt>
            <dd>
              <a href={safeWebsite(member.website)}>{member.website}</a>
            </dd>
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
          <p>
            Office location identifies where the company is based. Coverage
            areas above describe where services are available.
          </p>
        </aside>
      </section>
      <section className="profile-disclaimer">
        <div className="section">
          <Icon name="shield" />
          <p>
            {member.isPreview
              ? "This sample shows the public profile format and does not confirm membership or publication approval. "
              : ""}
            Published profiles contain approved public business information
            only. Membership is not regulatory certification.
          </p>
        </div>
      </section>
    </PublicShell>
  )
}
