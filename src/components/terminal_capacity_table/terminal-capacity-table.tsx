import { DataTable } from "./data-table.tsx";
import { columns} from "./columns.tsx";

interface TerminalCapacityTableProps {
  data: any[];
}

export function TerminalCapacityTable({ data}: TerminalCapacityTableProps) {
  return (
    <div className="container mx-auto p-10 overflow-x-auto">
      <DataTable columns={columns()} data={data} />
    </div>
  );
}


