import { useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import type { EquipmentDomain } from "../terminal-resource/equipment-domain"
import type { GangDomain } from "../terminal-resource/gang-domain"
import { Button } from "../ui/button"
import { ResourceTable } from "./resource-table"
import { GangDialog } from "./gang-dialog"
import { gangTypes } from "./capacity-rules"
import { DeleteResourceDialog, DeleteTarget } from "./delete-resource-dialog"
import { RowActions, SectionHeader } from "./section"
import type { Row } from "./use-capacity-data"

export function GangsTab({ terminalId, gangs, equipmentTypes, reload }: {
  terminalId: string
  gangs: Row<GangDomain>[]
  equipmentTypes: Row<EquipmentDomain>[]
  reload: () => Promise<void>
}) {
  const [dialog, setDialog] = useState<{ item: Row<GangDomain> | null } | null>(null)
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null)

  const columns = useMemo<ColumnDef<Row<GangDomain>>[]>(() => {
    const label = (code: string) => equipmentTypes.find((t) => t.record.equipmentType === code)?.record.label ?? code
    return [
      { id: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.record.name}</span> },
      {
        id: "types", header: "Usually works",
        cell: ({ row }) => {
          const types = gangTypes(row.original.record)
          return types.length ? types.map(label).join(", ") : <span className="text-gray-500">Any</span>
        },
      },
      { id: "notes", header: "Notes", cell: ({ row }) => <span className="text-gray-600">{row.original.record.notes}</span> },
      {
        id: "actions", header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RowActions
            name={row.original.record.name}
            onEdit={() => setDialog({ item: row.original })}
            onDelete={() => setDeleting({ item: row.original, kind: "Gang", name: row.original.record.name })}
          />
        ),
      },
    ]
  }, [equipmentTypes])

  return (
    <div className="grid gap-3">
      <SectionHeader
        title="Gangs"
        description="Crews you assign when you confirm a visit. A gang can be on more than one visit at a time; take it offline with an outage."
        action={<Button onClick={() => setDialog({ item: null })}><Plus /> Add Gang</Button>}
      />
      <ResourceTable columns={columns} data={gangs} emptyText="No gangs yet." />
      <GangDialog terminalId={terminalId} gang={dialog?.item ?? null} equipmentTypes={equipmentTypes} open={dialog !== null} onClose={() => setDialog(null)} onDone={reload} />
      <DeleteResourceDialog target={deleting} onClose={() => setDeleting(null)} onDone={reload} />
    </div>
  )
}
