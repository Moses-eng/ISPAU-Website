import { workspaceAlerts } from "@/features/notifications/model"
import { staffWorkspace as StaffWorkspace } from "./workspaceModules"
import Login from "@/features/auth/pages/Login"
import LoadingState from "@/components/dashboard/LoadingState"
import { lazy, Suspense, useState, useEffect } from "react"
import useCreditWorkspace, {
  creditService,
} from "@/features/trade-credit/workspace/service"
import { canParticipate } from "@/features/trade-credit/workspace/model"
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
  const credit = useCreditWorkspace()
  const { state, actor } = useMembershipWorkspace(),
    [switching, setSwitching] = useState(false),
    [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(
      null,
    )
  useEffect(() => {
    if (!actor) return
    void creditService.refresh(actor)
    const timer = setInterval(() => {
      void creditService.refresh(actor)
    }, 5000)
    return () => clearInterval(timer)
  }, [actor, state])
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
  const alerts = actor
    ? workspaceAlerts(actor, state)
    : { items: [], counts: {} as Record<string, number> }
  if (actor && canParticipate(actor, state.applications, state.invoices)) {
    for (const r of credit.records.filter(
      (r) => r.organisationId === actor.organisationId && r.reviewOutcome,
    )) {
      alerts.items.push({
        id: `complaint-review:${r.id}:${r.updatedAt}`,
        title: `Complaint ${r.reviewOutcome?.toLowerCase()}`,
        detail: `${r.customer} · ${r.verification || r.reviewOutcome}`,
        route: "trade-credit",
        date: r.updatedAt,
      })
      if (r.reviewOutcome === "Clarification needed")
        alerts.counts["trade-credit"] = (alerts.counts["trade-credit"] || 0) + 1
    }
    for (const n of creditService.getNotices())
      if (!credit.records.some((r) => r.id === n.id))
        alerts.items.push({
          id: `reference-notice:${n.id}:${n.updatedAt}`,
          title: "A verified credit reference is available",
          detail: `Case ${n.id}. Use an authorised customer reference request.`,
          route: "trade-credit",
          date: n.updatedAt,
        })
  }
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
  if (!actor && !staff)
    return <Login go={(view) => navigateTo(`/#${view}`)} onSignIn={signIn} />
  if (!actor)
    return (
      <main className="workspace-demo-login">
        <Logo onClick={() => navigateTo("/")} />
        <span className="eyebrow mt-8 block">ISPAU · Workspace preview</span>
        <h1>{staff ? "ISPAU administration" : "ISP Account Manager"}</h1>
        <p>Choose a workspace to continue.</p>
        <DemoIdentity onSelect={signIn} />
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
      navigation={navigation.map((item) => ({
        ...item,
        count: alerts.counts[item.id] || 0,
      }))}
      alerts={alerts.items}
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
          {staff && <DemoIdentity onSelect={signIn} />}
        </Dialog>
      )}
    </WorkspaceShell>
  )
}
