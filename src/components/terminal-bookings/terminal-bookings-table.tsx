import { DataTable } from "./data-table.tsx";
import { columns,CompletedColumn } from "./columns";

interface TerminalBookingsTableProps {
  data: any[];
  status: string;
  meta: any;
}

export function TerminalBookingsTable({ data, status, meta }: TerminalBookingsTableProps) {
  return (
    <DataTable columns={columns(status)} data={data} meta={meta} />
  )
}

export function TerminalBookingModification({ data, status, meta }: TerminalBookingsTableProps) {
  return (
    <DataTable columns={columns(status)} data={data} meta={meta} />
  )
}

export function TerminalBookingsCompleted({ data}: TerminalBookingsTableProps) {
  return (
    <DataTable columns={CompletedColumn()} data={data} />
  )
}
