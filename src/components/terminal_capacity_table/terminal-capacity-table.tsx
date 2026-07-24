import { DataTable } from "./data-table.tsx";
import { columns} from "./columns.tsx";

interface TerminalCapacityTableProps {
  data: any[];
}

export function TerminalCapacityTable({ data}: TerminalCapacityTableProps) {
  return (
    <DataTable columns={columns} data={data} />
  );
}
