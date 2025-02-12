import { DataTable } from "./data-table.tsx";
import { columns,CompletedColumn, OngoingColumn } from "./columns";

interface BcoBookingsTableProps {
  data: any[];
  status: string;
}

export function BcoBookingsTableUpcoming({ data }: BcoBookingsTableProps) {
  return (
    <div className="container mx-auto p-10">
      <DataTable columns={columns()} data={data} />
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
