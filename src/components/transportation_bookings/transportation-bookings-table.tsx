import { DataTable } from "./data-table.tsx";
import { columns,CompletedColumn, OngoingColumn } from "./columns";

interface TransportationBookingsTableProps {
  data: any[];
  status: string;
  meta: any;
}

export function TransportationBookingsTableUpcoming({ data, meta }: TransportationBookingsTableProps) {
  return (
    <div className="container mx-auto p-10">
      <DataTable columns={columns()} data={data} meta={meta} />
    </div>
  );
}

export function TransportationBookingsTableOngoing({ data}: TransportationBookingsTableProps) {
  return (
    <div className="container mx-auto p-10">
      <DataTable columns={OngoingColumn()} data={data} />
    </div>
  );
}

  export function TransportationBookingsTableCompleted({ data}: TransportationBookingsTableProps) {
    return (
      <div className="container mx-auto p-10">
        <DataTable columns={CompletedColumn()} data={data} />
      </div>
    );

}
