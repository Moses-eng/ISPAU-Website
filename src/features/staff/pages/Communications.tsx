import { useState } from "react"
import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import Button from "@/components/ui/Button"
import { membershipService } from "@/services/membershipService"
export default function Communications({
  state,
  actor,
  feedback,
}: {
  state: WorkspaceState
  actor: Actor
  feedback: (message: string, error?: boolean) => void
}) {
  const applications = state.applications.filter((a) => a.stage !== "Draft")
  const [id, setId] = useState(applications[0]?.id || ""),
    [template, setTemplate] = useState("Application acknowledgement")
  const a = applications.find((a) => a.id === id)
  const templates: Record<string, string> = {
    "Application acknowledgement": `We have received application ${a?.id} for ${a?.organisation}. Your current stage is ${a?.stage}.`,
    "Clarification request": `Please respond to the following consolidated corrections:\n${a?.clarifications.slice(-1)[0]?.items.join("\n") || "No clarification request recorded; use the review screen to create one."}`,
    "Admission decision":
      a?.decisions.slice(-1)[0]?.reason ||
      "No decision has been recorded. A message does not create an admission decision.",
    Welcome: `Welcome ${a?.organisation}. Your member ID is ${a?.memberId || "not yet issued"}.`,
    "Renewal reminder": `Please confirm the organisation details for ${a?.organisation}. The recorded membership period ends ${a?.periodEnd}. No automatic renewal or expiry is applied.`,
  }
  return (
    <>
      <PageHeader
        title="Communications"
        description="Prepare membership notices and review their history."
      />
      <div className="workspace-review-grid">
        <section className="workspace-panel">
          <h2>Template preview</h2>
          <label className="field">
            Organisation
            <select value={id} onChange={(e) => setId(e.target.value)}>
              {applications.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.organisation}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Notice
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {Object.keys(templates).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <p className="workspace-help">
            Review the recipient and message before preparing the notice.
          </p>
          <form
            key={`${id}-${template}`}
            className="workspace-form"
            onSubmit={(e) => {
              e.preventDefault()
              try {
                membershipService.dispatch(actor, {
                  type: "send-notice",
                  id,
                  template,
                  body: String(new FormData(e.currentTarget).get("message")),
                })
                feedback("Notice prepared. Email delivery is pending.")
              } catch (error) {
                feedback((error as Error).message, true)
              }
            }}
          >
            <label className="field">
              Message preview *
              <textarea
                name="message"
                required
                defaultValue={templates[template]}
                rows={8}
              />
            </label>
            <Button type="submit">Prepare notice</Button>
          </form>
        </section>
        <section className="workspace-panel">
          <h2>Notice history</h2>
          <DataTable
            rows={state.notices
              .filter((n) => n.applicationId === id)
              .slice()
              .reverse()}
            label="Notice preparation history"
            rowKey={(n) => n.id}
            columns={[
              { label: "Notice", cell: (n) => n.template },
              {
                label: "Date",
                cell: (n) => new Date(n.date).toLocaleString("en-GB"),
                sort: (n) => n.date,
              },
              { label: "Recorded by", cell: (n) => n.actor },
            ]}
          />
        </section>
      </div>
    </>
  )
}
