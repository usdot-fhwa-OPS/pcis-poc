import { useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Pencil, Plus } from "lucide-react"
import type { TerminalHours } from "../terminal-resource/terminal-resource-manager-client"
import type { ClosureDomain } from "../terminal-resource/closure-domain"
import { DAYS, DAY_LABELS, formatDate, formatIntervals } from "../terminal-resource/capacity-format"
import { Button } from "../ui/button"
import { ResourceTable } from "./resource-table"
import { WeeklyHoursDialog } from "./weekly-hours-dialog"
import { ClosureDialog } from "./closure-dialog"
import { DeleteResourceDialog, DeleteTarget } from "./delete-resource-dialog"
import { RowActions, SectionHeader } from "./section"
import type { Row } from "./use-capacity-data"

export function HoursTab({ terminal, closures, reload }: {
  terminal: TerminalHours
  closures: Row<ClosureDomain>[]
  reload: () => Promise<void>
}) {
  const [editingHours, setEditingHours] = useState(false)
  const [closureDialog, setClosureDialog] = useState<{ closure: Row<ClosureDomain> | null } | null>(null)
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null)

  const columns = useMemo<ColumnDef<Row<ClosureDomain>>[]>(() => [
    { id: "date", header: "Date", cell: ({ row }) => <span className="font-medium whitespace-nowrap">{formatDate(row.original.record.date)}</span> },
    { id: "reason", header: "Reason", cell: ({ row }) => row.original.record.reason },
    { id: "hours", header: "Hours", cell: ({ row }) => formatIntervals(row.original.record.openIntervals) },
    {
      id: "actions", header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions
          name={formatDate(row.original.record.date)}
          onEdit={() => setClosureDialog({ closure: row.original })}
          onDelete={() => setDeleting({
            item: row.original, kind: "Closure", name: formatDate(row.original.record.date),
            note: "The terminal's regular weekly hours apply on that date again.",
          })}
        />
      ),
    },
  ], [])

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <SectionHeader
          title="Weekly hours"
          description={`When the terminal is open each week${terminal.timezone ? `, in ${terminal.timezone} time` : ""}.`}
          action={
            <Button variant="outline" onClick={() => setEditingHours(true)} disabled={!terminal.configured}>
              <Pencil /> Edit Hours
            </Button>
          }
        />
        {!terminal.configured && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This terminal has no BerthConfig record yet, so its hours can't be saved.
          </p>
        )}
        <div className="bg-white border rounded-xl divide-y">
          {DAYS.map((day) => (
            <div key={day} className="grid grid-cols-[8rem_1fr] gap-4 px-4 py-3 text-sm">
              <span className="font-medium">{DAY_LABELS[day]}</span>
              <span className={terminal.weeklyHours[day].length ? "" : "text-gray-500"}>{formatIntervals(terminal.weeklyHours[day])}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <SectionHeader
          title="Holidays and closures"
          description="Dates when the terminal is closed or open shorter hours. These replace the weekly hours for that date."
          action={<Button onClick={() => setClosureDialog({ closure: null })}><Plus /> Add Closure</Button>}
        />
        <ResourceTable columns={columns} data={closures} emptyText="No closures yet." />
      </section>

      <WeeklyHoursDialog terminal={terminal} open={editingHours} onClose={() => setEditingHours(false)} onDone={reload} />
      <ClosureDialog
        terminalId={terminal.terminalId}
        closure={closureDialog?.closure ?? null}
        open={closureDialog !== null}
        onClose={() => setClosureDialog(null)}
        onDone={reload}
      />
      <DeleteResourceDialog target={deleting} onClose={() => setDeleting(null)} onDone={reload} />
    </div>
  )
}
