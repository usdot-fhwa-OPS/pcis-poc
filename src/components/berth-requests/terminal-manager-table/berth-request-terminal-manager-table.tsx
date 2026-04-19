import { DataTable } from "./data-table.tsx";
import { columns} from "./columns.tsx";
import { berthRequestDecision } from "../berth-request-client.tsx";

interface TerminalOperatorBerthRequestsTableProps {
  data: any[];
  deleteBerthRequest: any
}
export function TerminalOperatorBerthRequestsTable({ data, deleteBerthRequest}: TerminalOperatorBerthRequestsTableProps) {
const decideBerthRequest = (requestId: string, decision:string) =>{
  
  berthRequestDecision(requestId, decision);

}
  return (
    <div className="container mx-auto p-10 overflow-x-auto">
      <DataTable columns={columns} data={data} meta = {{decideBerthRequest, deleteBerthRequest}}/>
    </div>
  );
}


