import { workspaceAlerts } from "@/features/notifications/model"
import { lazy, Suspense, useEffect, useState } from "react"
import StaffLogin from "@/features/staff/pages/StaffLogin"
import ChangePassword from "@/features/staff/components/ChangePassword"
import useAdminWorkspace from "@/hooks/useAdminWorkspace"
import systemUsersService from "@/apiServices/systemUsersService"
import systemUserAuthStore from "@/apiServices/systemUserAuthStore"
import { sessionService } from "@/services/sessionService"
import { canAccessSection } from "@/config/permissions"
import { staffNavigation, staffGroup } from "@/config/workspace"
import AdminLayout from "@/components/layout/AdminLayout"
import LoadingState from "@/components/dashboard/LoadingState"
import EmptyState from "@/components/dashboard/EmptyState"
import Dialog from "@/components/dashboard/Dialog"
import Button from "@/components/ui/Button"
import { navigateTo } from "./navigation"

const StaffWorkspace = lazy(
  () => import("@/features/staff/pages/StaffWorkspace"),
)

export default function App() {
  const { state, actor } = useAdminWorkspace()
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

    // Restore and validate session on initial mount
    if (systemUserAuthStore.isAuthenticated()) {
      void systemUsersService.getProfile().then((res) => {
        if (!res.success) {
          sessionService.signOut()
        }
      })
    }

    return () => {
      removeEventListener("popstate", update)
      removeEventListener("hashchange", update)
    }
  }, [])

  // Periodically and on focus validate the JWT session with the backend
  useEffect(() => {
    if (!actor || actor.kind !== "staff") return

    const validate = async () => {
      if (!systemUserAuthStore.isAuthenticated()) {
        sessionService.signOut()
        return
      }
      const res = await systemUsersService.getProfile()
      if (!res.success) {
        sessionService.signOut()
      }
    }

    const timer = setInterval(() => void validate(), 60000)
    const onFocus = () => void validate()
    addEventListener("focus", onFocus)

    return () => {
      clearInterval(timer)
      removeEventListener("focus", onFocus)
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

  if (!actor) return <StaffLogin onContinue={() => navigate("overview")} />

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

  const alerts = workspaceAlerts(actor, state)
  const navigation = staffNavigation
    .filter((item) => canAccessSection(actor, item.id))
    .map((item) => ({ ...item, count: alerts.counts[item.id] || 0 }))

  return (
    <AdminLayout
      key={actor.id + actor.roles.join("-")}
      actor={actor}
      navigation={navigation}
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
                void systemUsersService
                  .logout()
                  .then(() => {
                    sessionService.signOut()
                    setAccount(false)
                  })
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
