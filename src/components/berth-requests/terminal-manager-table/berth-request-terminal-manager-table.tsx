import { DataTable } from "./data-table.tsx";
import { columns} from "./columns.tsx";

interface TerminalOperatorBerthRequestsTableProps {
  data: any[];
}

export function TerminalOperatorBerthRequestsTable({ data}: TerminalOperatorBerthRequestsTableProps) {
  return (
    <div className="container mx-auto p-10 overflow-x-auto">
      <DataTable columns={columns} data={data} />
    </div>
  );
}


