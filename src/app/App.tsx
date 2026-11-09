import { lazy, Suspense, useEffect, useState } from "react"
import StaffLogin from "@/features/staff/pages/StaffLogin"
import ChangePassword from "@/features/staff/components/ChangePassword"
import useAdminWorkspace from "@/hooks/useAdminWorkspace"
import { staffAuthService } from "@/services/staffAuthService"
import { sessionService } from "@/services/sessionService"
import { canAccessSection } from "@/config/permissions"
import { staffNavigation, staffGroup } from "@/config/workspace"
import AdminLayout from "@/components/layout/AdminLayout"
import LoadingState from "@/components/dashboard/LoadingState"
import EmptyState from "@/components/dashboard/EmptyState"
import Dialog from "@/components/dashboard/Dialog"
import Button from "@/components/ui/Button"
import { navigateTo } from "./navigation"
import { workspaceAlerts } from "@/features/notifications/model"
import useComplaints from "@/features/trade-credit/services/useComplaints"
const StaffWorkspace = lazy(
  () => import("@/features/staff/pages/StaffWorkspace"),
)
export default function App() {
  const { state, actor } = useAdminWorkspace()
  const { snapshot: credit } = useComplaints(actor)
  const [url, setUrl] = useState(location.pathname + location.hash)
  const [account, setAccount] = useState(false)
  const [password, setPassword] = useState(false)
  const [notice, setNotice] = useState<{
    text: string
    error?: boolean
  } | null>(null)
  useEffect(() => {
    const update = () => setUrl(location.pathname + location.hash)
    addEventListener("popstate", update)
    addEventListener("hashchange", update)
    void staffAuthService.restoreOnce()
    return () => {
      removeEventListener("popstate", update)
      removeEventListener("hashchange", update)
    }
  }, [])
  useEffect(() => {
    if (actor?.kind !== "staff") return
    const validate = () => {
      void staffAuthService
        .validateSession()
        .catch(() => sessionService.signOut())
    }
    const timer = setInterval(validate, 60000)
    addEventListener("focus", validate)
    validate()
    return () => {
      clearInterval(timer)
      removeEventListener("focus", validate)
    }
  }, [actor, url])
  const route =
    location.hash.replace(/^#\/?/, "") ||
    location.pathname.replace(/^\/staff\/?/, "").replace(/^\//, "") ||
    "overview"
  const navigate = (next: string) => {
    setNotice(null)
    navigateTo("/#/" + next)
  }
  const feedback = (text: string, error = false) => setNotice({ text, error })
  const invitationToken = route.startsWith("password-setup")
    ? new URLSearchParams(route.split("?")[1]).get("token") || "invalid"
    : ""
  if (!actor || route.startsWith("password-setup"))
    return (
      <StaffLogin
        invitationToken={invitationToken}
        onContinue={() => navigate("overview")}
      />
    )
  if (actor.kind !== "staff")
    return (
      <EmptyState
        title="Access denied"
        text="An administrator account is required."
        action={
          <Button onClick={() => sessionService.signOut()}>Sign out</Button>
        }
      />
    )
  const alerts = workspaceAlerts(
    actor,
    state,
    credit.records.filter((r) => !r.approved && !r.reviewOutcome),
  )
  const navigation = staffNavigation
    .filter((item) => canAccessSection(actor, item.id))
    .map((item) => ({ ...item, count: alerts.counts[item.id] || 0 }))
  return (
    <AdminLayout
      key={actor.id + actor.roles.join("-")}
      actor={actor}
      navigation={navigation}
      alerts={alerts.items}
      current={staffGroup(route.split("/")[0])}
      onNavigate={navigate}
      onIdentity={() => setAccount(true)}
    >
      {notice && (
        <div
          className={"workspace-feedback " + (notice.error ? "error" : "")}
          role={notice.error ? "alert" : "status"}
        >
          {notice.text}
          <button aria-label="Dismiss message" onClick={() => setNotice(null)}>
            ✕
          </button>
        </div>
      )}
      <Suspense fallback={<LoadingState />}>
        <StaffWorkspace
          key={actor.id + actor.roles.join("-")}
          state={state}
          actor={actor}
          route={route}
          navigate={navigate}
          feedback={feedback}
        />
      </Suspense>
      {password && <ChangePassword onClose={() => setPassword(false)} />}
      {account && (
        <Dialog title="Administrator account" onClose={() => setAccount(false)}>
          <p>{actor.name}. Access follows your assigned staff role.</p>
          <div className="flex flex-wrap gap-3">
            <Button
              kind="secondary"
              onClick={() => {
                setAccount(false)
                setPassword(true)
              }}
            >
              Change your password
            </Button>
            <Button
              kind="secondary"
              onClick={() => {
                void staffAuthService
                  .logout()
                  .then(() => setAccount(false))
                  .catch((error) => feedback((error as Error).message, true))
              }}
            >
              Sign out
            </Button>
          </div>
        </Dialog>
      )}
    </AdminLayout>
  )
}
