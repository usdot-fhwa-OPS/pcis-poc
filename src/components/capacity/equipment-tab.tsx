import { useMemo, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Plus } from "lucide-react"
import type { EquipmentDomain } from "../terminal-resource/equipment-domain"
import type { UnitDomain } from "../terminal-resource/unit-domain"
import { Button } from "../ui/button"
import { ResourceTable } from "./resource-table"
import { EquipmentTypeDialog } from "./equipment-type-dialog"
import { UnitDialog } from "./unit-dialog"
import { DeleteResourceDialog, DeleteTarget } from "./delete-resource-dialog"
import { RowActions, SectionHeader, StatusBadge } from "./section"
import type { Row } from "./use-capacity-data"

export function EquipmentTab({ terminalId, equipmentTypes, units, reload }: {
  terminalId: string
  equipmentTypes: Row<EquipmentDomain>[]
  units: Row<UnitDomain>[]
  reload: () => Promise<void>
}) {
  const [typeDialog, setTypeDialog] = useState<{ item: Row<EquipmentDomain> | null } | null>(null)
  const [unitDialog, setUnitDialog] = useState<{ item: Row<UnitDomain> | null } | null>(null)
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null)

  const typeColumns = useMemo<ColumnDef<Row<EquipmentDomain>>[]>(() => [
    { id: "label", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.record.label}</span> },
    { id: "code", header: "Code", cell: ({ row }) => <code className="text-xs text-gray-600">{row.original.record.equipmentType}</code> },
    { id: "duration", header: "Default duration", cell: ({ row }) => `${row.original.record.defaultDurationMins} min` },
    { id: "gangs", header: "Gangs per job", cell: ({ row }) => row.original.record.gangsRequired },
    {
      id: "units", header: "Units",
      cell: ({ row }) => units.filter((u) => u.record.equipmentType?.toUpperCase() === row.original.record.equipmentType).length,
    },
    { id: "active", header: "Status", cell: ({ row }) => <StatusBadge on={row.original.record.active !== false} onLabel="Active" offLabel="Inactive" /> },
    {
      id: "actions", header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions
          name={row.original.record.label}
          onEdit={() => setTypeDialog({ item: row.original })}
          onDelete={() => setDeleting({
            item: row.original, kind: "Equipment type", name: row.original.record.label,
            note: "It won't be offered on new requests. A type that units still use can't be deleted.",
          })}
        />
      ),
    },
  ], [units])

  const unitColumns = useMemo<ColumnDef<Row<UnitDomain>>[]>(() => {
    const typeLabel = (code: string) =>
      equipmentTypes.find((t) => t.record.equipmentType === code?.toUpperCase())?.record.label ?? code
    return [
    { id: "name", header: "Name", cell: ({ row }) => <span className="font-medium">{row.original.record.name}</span> },
    { id: "type", header: "Type", cell: ({ row }) => typeLabel(row.original.record.equipmentType) },
    {
      id: "duration", header: "Duration",
      cell: ({ row }) => row.original.record.defaultDurationMins ? `${row.original.record.defaultDurationMins} min (override)` : <span className="text-gray-500">Type default</span>,
    },
    { id: "service", header: "Status", cell: ({ row }) => <StatusBadge on={row.original.record.inService !== false} onLabel="In service" offLabel="Out of service" /> },
    { id: "notes", header: "Notes", cell: ({ row }) => <span className="text-gray-600">{row.original.record.notes}</span> },
    {
      id: "actions", header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions
          name={row.original.record.name}
          onEdit={() => setUnitDialog({ item: row.original })}
          onDelete={() => setDeleting({ item: row.original, kind: "Unit", name: row.original.record.name })}
        />
      ),
    },
  ]}, [equipmentTypes])

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <SectionHeader
          title="Equipment types"
          description="Kinds of equipment and how long a job takes by default. Transportation Coordinators pick from the active types."
          action={<Button onClick={() => setTypeDialog({ item: null })}><Plus /> Add Equipment Type</Button>}
        />
        <ResourceTable columns={typeColumns} data={equipmentTypes} emptyText="No equipment types yet." />
      </section>
      <section className="grid gap-3">
        <SectionHeader
          title="Units"
          description="Each named piece of equipment. Visits are booked against these."
          action={<Button onClick={() => setUnitDialog({ item: null })} disabled={equipmentTypes.length === 0}><Plus /> Add Unit</Button>}
        />
        <ResourceTable columns={unitColumns} data={units} emptyText="No units yet." />
      </section>

      <EquipmentTypeDialog terminalId={terminalId} equipmentType={typeDialog?.item ?? null} open={typeDialog !== null} onClose={() => setTypeDialog(null)} onDone={reload} />
      <UnitDialog terminalId={terminalId} unit={unitDialog?.item ?? null} equipmentTypes={equipmentTypes} open={unitDialog !== null} onClose={() => setUnitDialog(null)} onDone={reload} />
      <DeleteResourceDialog target={deleting} onClose={() => setDeleting(null)} onDone={reload} />
    </div>
  )
}
