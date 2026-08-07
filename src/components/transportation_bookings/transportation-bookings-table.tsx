import { DataTable } from "./data-table.tsx";
import { columns,CompletedColumn, OngoingColumn } from "./columns";

interface TransportationBookingsTableProps {
  data: any[];
  status: string;
  meta: any;
}

export function TransportationBookingsTableUpcoming({ data, meta }: TransportationBookingsTableProps) {
  return (
    <DataTable columns={columns()} data={data} meta={meta} />
  );
}

export function TransportationBookingsTableOngoing({ data, meta }: TransportationBookingsTableProps) {
  return (
    <DataTable columns={OngoingColumn()} data={data} meta={meta}/>
  );
}

  export function TransportationBookingsTableCompleted({ data}: TransportationBookingsTableProps) {
    return (
      <DataTable columns={CompletedColumn()} data={data} />
    );
}
