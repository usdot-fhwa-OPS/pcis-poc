import { DataTable } from "./data-table.tsx";
import { columns,CompletedColumn, OngoingColumn } from "./columns";

interface BcoBookingsTableProps {
  data: any[];
  status: string;
  meta: any;
}

export function BcoBookingsTableUpcoming({ data, meta }: BcoBookingsTableProps) {
  return (
    <div className="container mx-auto p-10">
      <DataTable columns={columns()} data={data} meta={meta} />
    </div>
  );
}

export function BcoBookingsTableOngoing({ data}: BcoBookingsTableProps) {
  return (
    <div className="container mx-auto p-10">
      <DataTable columns={OngoingColumn()} data={data} />
    </div>
  );
}

  export function BcoBookingsTableCompleted({ data}: BcoBookingsTableProps) {
    return (
      <div className="container mx-auto p-10">
        <DataTable columns={CompletedColumn()} data={data} />
      </div>
    );

}
