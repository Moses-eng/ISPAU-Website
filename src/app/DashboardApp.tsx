import { staffWorkspace as StaffWorkspace } from "./workspaceModules"
import LoadingState from "@/components/dashboard/LoadingState"
import { lazy, Suspense, useState } from "react"
import useMembershipWorkspace from "@/hooks/useMembershipWorkspace"
import { demoSession } from "@/services/demoSession"
import WorkspaceShell from "@/components/dashboard/WorkspaceShell"
import DemoIdentity from "@/components/dashboard/DemoIdentity"
import Dialog from "@/components/dashboard/Dialog"
import EmptyState from "@/components/dashboard/EmptyState"
import Button from "@/components/ui/Button"
import Logo from "@/components/layout/Logo"
const MemberWorkspace = lazy(
  () => import("@/features/portal/pages/MemberWorkspace"),
)
import MembershipApplication from "@/features/membership/pages/MembershipApplication"
import {
  staffSections,
  workspaceFlags,
  staffGroup,
  memberGroup,
  staffNavigation,
  memberNavigation,
} from "@/config/workspace"
import type { Actor } from "@/features/membership/types/workspace"
import { navigateTo } from "./navigation"
export default function DashboardApp({ url }: { url: string }) {
  const { state, actor } = useMembershipWorkspace(),
    [switching, setSwitching] = useState(false),
    [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(
      null,
    )
  const staff = location.pathname.startsWith("/staff"),
    kind = staff ? "staff" : "organisation"
  const route =
    location.hash.replace(/^#\/?/, "") ||
    location.pathname.split("/").slice(2).join("/") ||
    "overview"
  const navigate = (next: string) => {
    setNotice(null)
    navigateTo(`${staff ? "/staff" : "/portal"}#/${next}`)
  }
  const feedback = (text: string, error = false) => setNotice({ text, error })
  const signIn = (identity: Actor) => {
    demoSession.signIn(identity)
    setSwitching(false)
    navigate(
      !staff &&
        route === "application" &&
        state.applications.some(
          (a) =>
            a.organisationId === identity.organisationId && a.stage === "Draft",
        )
        ? "application"
        : "overview",
    )
  }
  const application = state.applications.find(
    (a) => a.organisationId === actor?.organisationId,
  )
  const navigation = staff
    ? staffNavigation.filter(
        (item) =>
          (item.id !== "trade-credit" || workspaceFlags.tradeCreditEnabled) &&
          actor?.kind === "staff" &&
          staffSections.some(
            (section) =>
              staffGroup(section.id) === item.id &&
              section.roles.some((role) => actor.roles.includes(role)),
          ),
      )
    : (application?.stage === "Active"
        ? memberNavigation
        : [
            { id: "overview", label: "Overview", icon: "chart" },
            { id: "application", label: "Application", icon: "file" },
            { id: "invoices", label: "Invoices", icon: "file" },
            { id: "account", label: "Account", icon: "lock" },
          ]
      ).filter(
        (item) =>
          item.id !== "trade-credit" || workspaceFlags.tradeCreditEnabled,
      )
  if (staff && !StaffWorkspace)
    return (
      <main className="workspace-demo-login">
        <Logo onClick={() => navigateTo("/")} />
        <EmptyState
          title="Workspace unavailable"
          text="Use the member portal to access your organisation’s services."
          action={
            <Button onClick={() => navigateTo("/portal")}>
              Open member portal
            </Button>
          }
        />
      </main>
    )
  if (!actor)
    return (
      <main className="workspace-demo-login">
        <Logo onClick={() => navigateTo("/")} />
        <span className="eyebrow mt-8 block">ISPAU · Workspace preview</span>
        <h1>{staff ? "ISPAU administration" : "ISP Account Manager"}</h1>
        <p>Choose a workspace to continue.</p>
        <DemoIdentity
          kind={kind}
          state={state}
          applicationMode={!staff && route === "application"}
          onSelect={signIn}
        />
      </main>
    )
  if (actor.kind !== kind)
    return (
      <main className="workspace-demo-login">
        <EmptyState
          title="Access denied"
          text="This identity cannot access the other workspace. Organisation and staff permissions remain separate."
          action={
            <Button onClick={() => demoSession.signOut()}>
              Change workspace
            </Button>
          }
        />
      </main>
    )
  if (
    !workspaceFlags.tradeCreditEnabled &&
    /trade|tc-|reference|dispute|reviewer/.test(route)
  )
    return (
      <main className="workspace-demo-login">
        <EmptyState
          title="Module unavailable"
          text="Trade Credit is not currently available."
          action={
            <Button onClick={() => navigate("overview")}>
              Return to overview
            </Button>
          }
        />
      </main>
    )
  if (!staff && route === "application" && application?.stage === "Draft")
    return (
      <>
        <MembershipApplication
          workspaceApplication={application}
          actor={actor}
          onFeedback={feedback}
          go={(view) =>
            ["home", "membership"].includes(view)
              ? navigateTo(`/#${view}`)
              : navigate("overview")
          }
        />
        {notice && (
          <div
            role={notice.error ? "alert" : "status"}
            className="workspace-feedback"
          >
            {notice.text}
          </div>
        )}
      </>
    )
  return (
    <WorkspaceShell
      actor={actor}
      navigation={navigation}
      current={
        staff
          ? staffGroup(route.split("/")[0])
          : application?.stage === "Active"
            ? memberGroup(route.split("/")[0])
            : route.split("/")[0]
      }
      onNavigate={navigate}
      onIdentity={() => setSwitching(true)}
    >
      {notice && (
        <div
          className={`workspace-feedback ${notice.error ? "error" : ""}`}
          role={notice.error ? "alert" : "status"}
        >
          {notice.text}
          <button aria-label="Dismiss message" onClick={() => setNotice(null)}>
            ✕
          </button>
        </div>
      )}
      <Suspense fallback={<LoadingState />}>
        {staff && StaffWorkspace ? (
          <StaffWorkspace
            key={url.split("#")[0]}
            state={state}
            actor={actor}
            route={route}
            navigate={navigate}
            feedback={feedback}
          />
        ) : (
          <MemberWorkspace
            state={state}
            actor={actor}
            route={route}
            navigate={navigate}
            feedback={feedback}
          />
        )}
      </Suspense>
      {switching && (
        <Dialog title="Workspace account" onClose={() => setSwitching(false)}>
          <p>
            Current workspace: {staff ? "ISPAU administration" : actor.name}.{" "}
            {staff
              ? "Administrator access to ISPAU operations."
              : "Account Manager access is limited to this ISP organisation."}{" "}
          </p>
          <Button
            kind="secondary"
            onClick={() => {
              demoSession.signOut()
              setSwitching(false)
            }}
          >
            Sign out
          </Button>
          {StaffWorkspace && (
            <div className="flex flex-wrap gap-3 my-5">
              <Button
                kind="secondary"
                onClick={() => {
                  demoSession.signOut()
                  setSwitching(false)
                  navigateTo(staff ? "/portal" : "/staff")
                }}
              >
                Open {staff ? "ISP organisation" : "ISPAU Admin"} workspace
              </Button>
            </div>
          )}
          <DemoIdentity kind={kind} state={state} onSelect={signIn} />
        </Dialog>
      )}
    </WorkspaceShell>
  )
}
