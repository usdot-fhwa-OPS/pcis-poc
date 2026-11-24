import { useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import type { GangDomain } from "../terminal-resource/gang-domain"
import type { OutageDomain } from "../terminal-resource/outage-domain"
import type { UnitDomain } from "../terminal-resource/unit-domain"
import { describeRecurrence, formatSpan } from "../terminal-resource/capacity-format"
import { Button } from "../ui/button"
import { ResourceTable } from "./resource-table"
import { OutageDialog } from "./outage-dialog"
import { DeleteResourceDialog, DeleteTarget } from "./delete-resource-dialog"
import { RowActions, SectionHeader } from "./section"
import type { Row } from "./use-capacity-data"

export function OutagesTab({ terminalId, timezone, outages, units, gangs, reload }: {
  terminalId: string
  timezone: string | null
  outages: Row<OutageDomain>[]
  units: Row<UnitDomain>[]
  gangs: Row<GangDomain>[]
  reload: () => Promise<void>
}) {
  const [dialog, setDialog] = useState<{ item: Row<OutageDomain> | null } | null>(null)
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null)

  const columns = useMemo<ColumnDef<Row<OutageDomain>>[]>(() => {
    const targetName = (o: OutageDomain) => {
      const list = o.resourceType === "GANG" ? gangs : units
      return list.find((r) => r.sk === `${o.resourceType}#${o.resourceId}`)?.record.name ?? "(deleted)"
    }
    return [
      {
        id: "target", header: "Unit or gang",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{targetName(row.original.record)}</div>
            <div className="text-xs text-gray-500">{row.original.record.resourceType === "GANG" ? "Gang" : "Unit"}</div>
          </div>
        ),
      },
      { id: "reason", header: "Reason", cell: ({ row }) => row.original.record.reason },
      { id: "when", header: "When", cell: ({ row }) => <span className="whitespace-nowrap">{formatSpan(row.original.record.startAt, row.original.record.endAt)}</span> },
      { id: "repeat", header: "Repeats", cell: ({ row }) => describeRecurrence(row.original.record.recurrence) },
      {
        id: "actions", header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RowActions
            name={`outage for ${targetName(row.original.record)}`}
            onEdit={() => setDialog({ item: row.original })}
            onDelete={() => setDeleting({
              item: row.original, kind: "Outage", name: `the outage for ${targetName(row.original.record)}`,
              note: "It will be available for assignment during those times again.",
            })}
          />
        ),
      },
    ]
  }, [units, gangs])

  return (
    <div className="grid gap-3">
      <SectionHeader
        title="Outages"
        description={`Times a unit or gang is offline for breakdowns, maintenance or labor shortages. Terminal local time${timezone ? ` (${timezone})` : ""}.`}
        action={<Button onClick={() => setDialog({ item: null })} disabled={units.length + gangs.length === 0}><Plus /> Add Outage</Button>}
      />
      <ResourceTable columns={columns} data={outages} emptyText="No outages scheduled." />
      <OutageDialog
        terminalId={terminalId}
        timezone={timezone}
        outage={dialog?.item ?? null}
        units={units}
        gangs={gangs}
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onDone={reload}
      />
      <DeleteResourceDialog target={deleting} onClose={() => setDeleting(null)} onDone={reload} />
    </div>
  )
}
