import {useState } from "react"

import { navigateTo } from "@/app/navigation"
import MembershipApplication from "./MembershipApplication"


export default function PublicApplication() {
  const [feedback] = useState("")
  return (
    <>
      <MembershipApplication
        go={(view) => {
          if (view === "submitted") return
          navigateTo(`/#${view}`)
        }}
      />
      {feedback && (
        <p role="status" className="workspace-feedback">
          {feedback}
        </p>
      )}
    </>
  )
}
