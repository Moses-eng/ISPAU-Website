import { useEffect, useState, useMemo } from "react"
import { profilePath } from "../services/profileSeo"
import CompanyLogo from "@/features/directory/components/CompanyLogo"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import type { View } from "@/types/View"
import directoryService, { normalizeStringArray,} from "@/apiServices/directoryService"
import { PublicMember } from "@/types/PublicMember"

export default function Directory({ go }: { go: (v: View) => void }) {
  const [membersList, setMembersList] = useState<PublicMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [service, setService] = useState("All services")
  const [coverage, setCoverage] = useState("All coverage areas")

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    void directoryService.list().then((res) => {
      if (!isMounted) return
      if (res.success) {
        setMembersList(res.data)
      } else {
        setError(res.message)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const services = useMemo(() => [
    "All services",
    ...Array.from(new Set(membersList.flatMap((m) => normalizeStringArray(m.services)))),
  ], [membersList])

  const coverageAreas = useMemo(() => [
    "All coverage areas",
    ...Array.from(new Set(membersList.flatMap((m) => normalizeStringArray(m.coverage)))),
  ], [membersList])

  const filteredMembers = useMemo(() => {
    return membersList.filter((member) => {
      const term = query.trim().toLowerCase()
      const memberServices = normalizeStringArray(member.services)
      const memberCoverage = normalizeStringArray(member.coverage)

      const matchesQuery =
        !term ||
        member.name?.toLowerCase().includes(term) ||
        member.description?.toLowerCase().includes(term) ||
        memberServices.some((item) => item.toLowerCase().includes(term))

      const matchesService =
        service === "All services" || memberServices.includes(service)

      const matchesCoverage =
        coverage === "All coverage areas" || memberCoverage.includes(coverage)

      return matchesQuery && matchesService && matchesCoverage
    })
  }, [membersList, query, service, coverage])

  return (
    <PublicShell go={go}>
      <PageHero
        eyebrow="Our Members"
        title="Organisations connecting Uganda."
        text="Explore public profiles for eligible active members whose directory information has been approved for publication."
      />

      <section className="section directory-section">
        <div className="directory-intro">
          <div>
            <span className="eyebrow">Public member directory</span>
            <h2>Find a member ISP</h2>
          </div>
          <p>
            Browse approved public company profiles of eligible active ISPAU members.
          </p>
        </div>

        <div className="directory-tools">
          <label className="directory-search">
            <span>Search members</span>
            <div>
              <Icon name="search" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search company name or service"
              />
            </div>
          </label>

          <label className="field">
            <span>Service</span>
            <select
              value={service}
              onChange={(event) => setService(event.target.value)}
            >
              {services.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Coverage area</span>
            <select
              value={coverage}
              onChange={(event) => setCoverage(event.target.value)}
            >
              {coverageAreas.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="directory-results-head">
          <strong>
            {filteredMembers.length} {filteredMembers.length === 1 ? "member" : "members"}
          </strong>

          {(query ||
            service !== "All services" ||
            coverage !== "All coverage areas") && (
            <button
              onClick={() => {
                setQuery("")
                setService("All services")
                setCoverage("All coverage areas")
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>
            Loading member directory…
          </div>
        ) : error ? (
          <div className="directory-empty">
            <h3>Unable to load directory</h3>
            <p>{error}</p>
          </div>
        ) : filteredMembers.length > 0 ? (
          <div className="member-directory-list">
            {filteredMembers.map((member) => {
              const servicesList = normalizeStringArray(member.services)
              const coverageList = normalizeStringArray(member.coverage)

              return (
                <article
                  className={`member-listing identity-card-${member.identity}`}
                  key={member.id}
                >
                  <div className="member-logo-wrap">
                      <CompanyLogo member={member} />
                  </div>

                  <div className="member-listing-copy">
                    <h3>{member.legal_name}</h3>
                    <p>{member.description}</p>
                    <div className="member-facts">
                      <span>
                        <small>Office location</small>
                        <strong>
                        {member.registered_address}
                        </strong>
                        <p>Uganda</p>
                      </span>
                      <span>
                        <small>Main services</small>
                        <strong>{servicesList.length ? servicesList.join(" · ") : "Internet Services"}</strong>
                      </span>
                      <span>
                        <small>Coverage areas</small>
                        <strong>{coverageList.length ? coverageList.join(" · ") : "Uganda"}</strong>
                      </span>
                    </div>
                  </div>
                  <a className="btn btn-secondary" href={profilePath(member)}>
                    View {member.legal_name} profile
                  </a>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="directory-empty">
            <Icon name="search" size={26} />
            <h3>No matching public profiles</h3>
            <p>Try a different service, coverage area or company name.</p>
            <Button
              kind="secondary"
              onClick={() => {
                setQuery("")
                setService("All services")
                setCoverage("All coverage areas")
              }}
            >
              Clear filters
            </Button>
          </div>
        )}

        <div className="directory-privacy">
          <Icon name="shield" />
          <p>
            Public profiles exclude personal representatives, application
            documents, billing information and internal association notes.
          </p>
        </div>
      </section>
    </PublicShell>
  )
}
