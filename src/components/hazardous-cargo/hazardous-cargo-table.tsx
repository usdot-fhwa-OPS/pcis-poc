import { DataTable } from "./data-table"
import { columns } from "./columns"
import { HazardousCargoItem } from "./hazardous-cargo-types"

interface HazardousCargoTableProps {
  data: HazardousCargoItem[]
}

export function HazardousCargoTable({ data }: HazardousCargoTableProps) {
  return (
    <DataTable columns={columns} data={data} />
  )
}
