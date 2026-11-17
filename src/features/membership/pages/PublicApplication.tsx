import { useEffect, useState } from "react"
import useMembershipWorkspace from "@/hooks/useMembershipWorkspace"
import { membershipService } from "@/services/membershipService"
import { navigateTo } from "@/app/navigation"
import MembershipApplication from "./MembershipApplication"
import LoadingState from "@/components/dashboard/LoadingState"
import EmptyState from "@/components/dashboard/EmptyState"
import Button from "@/components/ui/Button"
import type { Actor } from "@/features/membership/types/workspace"

export default function PublicApplication() {
  const { state } = useMembershipWorkspace()
  const [id, setId] = useState("")
  const [error, setError] = useState("")
  const [feedback, setFeedback] = useState("")
  useEffect(() => {
    try {
      setId(membershipService.startPublicApplication().id)
    } catch {
      setError("Unable to open the application. Please refresh and try again.")
    }
    const leave = () => {
      if (
        !/^\/portal\/?$/.test(location.pathname) ||
        location.hash.replace(/^#\/?/, "") !== "application"
      )
        membershipService.releasePublicApplication()
    }
    addEventListener("popstate", leave)
    addEventListener("hashchange", leave)
    return () => {
      removeEventListener("popstate", leave)
      removeEventListener("hashchange", leave)
    }
  }, [])
  if (error) return <EmptyState title="Application unavailable" text={error} />
  const application = state.applications.find((a) => a.id === id)
  if (!application) return <LoadingState />
  if (application.stage !== "Draft")
    return (
      <main className="workspace-demo-login">
        <EmptyState
          title="Application submitted"
          text="Your application has been recorded. Sign in with your official organisation email to check its progress."
          action={
            <Button
              onClick={() => {
                membershipService.releasePublicApplication()
                navigateTo("/#login")
              }}
            >
              Sign in
            </Button>
          }
        />
      </main>
    )
  // Scope preview draft actions to this newly created organisation only.
  // Do not sign in, grant a staff role, or expose the authenticated dashboard.
  const draftOwner: Actor = {
    id: `draft-${application.organisationId}`,
    name: application.organisation,
    kind: "organisation",
    roles: [],
    organisationId: application.organisationId,
  }
  return (
    <>
      <MembershipApplication
        workspaceApplication={application}
        actor={draftOwner}
        onFeedback={setFeedback}
        go={(view) => {
          if (view === "submitted") return
          membershipService.releasePublicApplication()
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
