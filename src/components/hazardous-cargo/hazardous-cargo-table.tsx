import { DataTable } from "../ui/data-table"
import { columns } from "./columns"
import { HazardousCargoItem } from "./hazardous-cargo-types"

interface HazardousCargoTableProps {
  data: HazardousCargoItem[]
}

export function HazardousCargoTable({ data }: HazardousCargoTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search cargo"
      emptyMessage="There is no hazardous cargo to display."
    />
  )
}
