import { useEffect, useMemo, useState, type ReactNode } from "react"
import Button from "@/components/ui/Button"
import EmptyState from "./EmptyState"
export type Column<T> = {
  label: string
  cell: (row: T) => ReactNode
  sort?: (row: T) => string | number
}
export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  label,
  pageSize = 5,
}: {
  rows: T[]
  columns: Column<T>[]
  rowKey: (row: T) => string
  label: string
  pageSize?: number
}) {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ index: number; direction: 1 | -1 }>({
    index: 0,
    direction: 1,
  })
  useEffect(() => setPage(1), [rows])
  const sorted = useMemo(() => {
    const accessor = columns[sort.index]?.sort
    return accessor
      ? [...rows].sort(
          (a, b) =>
            String(accessor(a)).localeCompare(String(accessor(b)), undefined, {
              numeric: true,
            }) * sort.direction,
        )
      : rows
  }, [rows, columns, sort])
  const pages = Math.max(1, Math.ceil(rows.length / pageSize)),
    current = Math.min(page, pages)
  if (!rows.length)
    return (
      <EmptyState
        title="No matching records"
        text="Try clearing the filters or using another search term."
      />
    )
  return (
    <div className="workspace-table-wrap">
      <table className="workspace-table">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr>
            {columns.map((column, i) => (
              <th
                key={column.label}
                aria-sort={
                  sort.index === i
                    ? sort.direction === 1
                      ? "ascending"
                      : "descending"
                    : "none"
                }
              >
                {column.sort ? (
                  <button
                    onClick={() =>
                      setSort({
                        index: i,
                        direction:
                          sort.index === i && sort.direction === 1 ? -1 : 1,
                      })
                    }
                  >
                    {column.label}{" "}
                    <span aria-hidden="true">
                      {sort.index === i
                        ? sort.direction === 1
                          ? "↑"
                          : "↓"
                        : "↕"}
                    </span>
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted
            .slice((current - 1) * pageSize, current * pageSize)
            .map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td key={column.label} data-label={column.label}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
      <div className="workspace-pagination">
        <span>
          {rows.length} results · Page {current} of {pages}
        </span>
        <div className="flex gap-2">
          <Button
            kind="secondary"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </Button>
          <Button
            kind="secondary"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
