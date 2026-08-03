import { DataTable } from "./data-table.tsx";
import { columns,CompletedColumn, OngoingColumn } from "./columns";

interface BcoBookingsTableProps {
  data: any[];
  status: string;
  meta: any;
}

export function BcoBookingsTableUpcoming({ data, meta }: BcoBookingsTableProps) {
  return (
    <DataTable columns={columns()} data={data} meta={meta} />
  );
}

export function BcoBookingsTableOngoing({ data,meta}: BcoBookingsTableProps) {
  return (
    <DataTable columns={OngoingColumn()}  data={data} meta={meta}  />
  );
}

  export function BcoBookingsTableCompleted({ data,meta }: BcoBookingsTableProps) {
    return (
      <DataTable columns={CompletedColumn()} data={data} meta={meta}/>
    );
}
