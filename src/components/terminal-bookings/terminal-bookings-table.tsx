import { DataTable } from "./data-table.tsx";
import { columns,CompletedColumn } from "./columns";

interface TerminalBookingsTableProps {
  data: any[];
  status: string;
  meta: any;
}

export function TerminalBookingsTable({ data, status, meta }: TerminalBookingsTableProps) {
  return (
    <div className="container mx-auto p-10 overflow-x-auto">
      <DataTable columns={columns(status)} data={data} meta={meta} />
    </div>
  );
}

export function TerminalBookingModification({ data, status, meta }: TerminalBookingsTableProps) {
    return (
      <div className="container mx-auto p-10 overflow-x-auto">
        <DataTable columns={columns(status)} data={data} meta={meta} />
      </div>
    )
}

  export function TerminalBookingsCompleted({ data}: TerminalBookingsTableProps) {
    return (
      <div className="container mx-w-xl p-10 overflow-x-auto">
        <DataTable columns={CompletedColumn()} data={data} />
      </div>
    );

}
