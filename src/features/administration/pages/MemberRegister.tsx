import Icon from "@/components/ui/Icon"
import Portal from "@/components/layout/Portal"
import PortalHeading from "@/components/ui/PortalHeading"
import Tag from "@/components/ui/Tag"
import type { View } from "@/types/View"
import { useState } from "react"

export default function MemberRegister({
  go,
  role = "Membership coordinator",
}: {
  go: (v: View) => void
  role?: "Membership coordinator" | "Secretariat / Administrator"
}) {
  const [query, setQuery] = useState("")
  const members = [
    ["ISPAU-M-0018", "Example Network Services Ltd", "Silver", "Active"],
    ["ISPAU-M-0017", "Nile Edge Systems Ltd", "Associate", "Active"],
  ].filter((row) => row.join(" ").toLowerCase().includes(query.toLowerCase()))
  return (
    <Portal go={go} active="Member register" role={role}>
      <PortalHeading
        title="Member Register"
        text="Authorised membership records and directory actions."
      />
      <div className="searchbar">
        <Icon name="search" />
        <input
          aria-label="Search member register"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search member ID or organisation"
        />
      </div>
      {members.length ? (
        <section className="panel table-panel">
          <div className="data-table">
            <div className="tr th">
              <span>Member ID</span>
              <span>Organisation</span>
              <span>Tier</span>
              <span>Status</span>
              <span>Directory</span>
            </div>
            {members.map((row) => (
              <button className="tr" key={row[0]}>
                {row.map((item, index) => (
                  <span key={item}>
                    {index === 3 ? <Tag tone="success">{item}</Tag> : item}
                  </span>
                ))}
                <span>Review profile →</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <div className="empty-result">
          <Icon name="search" />
          <h2>No members found</h2>
          <p>Try another member ID or organisation name.</p>
        </div>
      )}
    </Portal>
  )
}
