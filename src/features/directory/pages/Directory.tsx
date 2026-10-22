import CompanyLogo from "@/features/directory/components/CompanyLogo"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import PageHero from "@/components/ui/PageHero"
import PublicShell from "@/components/layout/PublicShell"
import type { View } from "@/types/View"
import { sampleMembers } from "@/features/directory/data/sampleMembers"
import { useState } from "react"

export default function Directory({
  go,
  onViewProfile,
}: {
  go: (v: View) => void
  onViewProfile: (id: string) => void
}) {
  const [query, setQuery] = useState("")
  const [service, setService] = useState("All services")
  const [coverage, setCoverage] = useState("All coverage areas")
  const services = [
    "All services",
    ...Array.from(new Set(sampleMembers.flatMap((member) => member.services))),
  ]
  const coverageAreas = [
    "All coverage areas",
    ...Array.from(new Set(sampleMembers.flatMap((member) => member.coverage))),
  ]
  const members = sampleMembers.filter((member) => {
    const term = query.trim().toLowerCase()
    const matchesQuery =
      !term ||
      member.name.toLowerCase().includes(term) ||
      member.description.toLowerCase().includes(term) ||
      member.services.some((item) => item.toLowerCase().includes(term))
    const matchesService =
      service === "All services" || member.services.includes(service)
    const matchesCoverage =
      coverage === "All coverage areas" || member.coverage.includes(coverage)
    return matchesQuery && matchesService && matchesCoverage
  })
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
            These sample profiles demonstrate the directory format and do not
            confirm ISPAU membership. Published listings must be active,
            eligible, approved and publication-consented.
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
            {members.length} {members.length === 1 ? "member" : "members"}
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
        {members.length ? (
          <div className="member-directory-list">
            {members.map((member) => (
              <article
                className={`member-listing identity-card-${member.identity}`}
                key={member.id}
              >
                <div className="member-logo-wrap">
                  <CompanyLogo member={member} />
                </div>
                <div className="member-listing-copy">
                  <h3>{member.name}</h3>
                  <p>{member.description}</p>
                  <div className="member-facts">
                    <span>
                      <small>Office location</small>
                      <strong>
                        {member.city}, {member.district} District
                      </strong>
                    </span>
                    <span>
                      <small>Main services</small>
                      <strong>{member.services.join(" · ")}</strong>
                    </span>
                    <span>
                      <small>Coverage areas</small>
                      <strong>{member.coverage.join(" · ")}</strong>
                    </span>
                  </div>
                </div>
                <Button
                  kind="secondary"
                  onClick={() => onViewProfile(member.id)}
                >
                  View Company Profile
                </Button>
              </article>
            ))}
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
