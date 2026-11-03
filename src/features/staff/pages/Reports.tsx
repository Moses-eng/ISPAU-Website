import type {
  Actor,
  WorkspaceState,
} from "@/features/membership/types/workspace"
import { buildStaffReport } from "@/features/membership/services/reports"
import PageHeader from "@/components/dashboard/PageHeader"
import DataTable from "@/components/dashboard/DataTable"
import PdfDownload from "@/components/dashboard/PdfDownload"

export default function Reports({
  state,
  actor,
}: {
  state: WorkspaceState
  actor: Actor
}) {
  const report = buildStaffReport(state, actor)
  return (
    <>
      <PageHeader
        title="Reports"
        description="Simple tables showing application counts, active members, renewals and authorised billing records."
        action={
          <PdfDownload
            actor={actor}
            request={{ kind: "report" }}
            label="Download report PDF"
          />
        }
      />
      <div className="flex flex-col gap-6">
        {report.sections.map((section) => (
          <section className="workspace-panel" key={section.id}>
            <div className="workspace-section-heading">
              <div>
                <h2>{section.title}</h2>
                {section.note && <p>{section.note}</p>}
              </div>
              <PdfDownload
                actor={actor}
                request={{ kind: "report", sectionId: section.id }}
                label="Download table PDF"
              />
            </div>
            <DataTable<{ id: string; cells: string[] }>
              rows={section.rows.map((cells, index) => ({
                id: String(index),
                cells,
              }))}
              label={section.title}
              rowKey={(row) => row.id}
              pageSize={10}
              columns={section.columns.map((label, index) => ({
                label,
                cell: (row) => row.cells[index],
                sort:
                  section.id === "stages" && index === 0
                    ? undefined
                    : (row) => row.cells[index],
              }))}
            />
          </section>
        ))}
      </div>
    </>
  )
}
