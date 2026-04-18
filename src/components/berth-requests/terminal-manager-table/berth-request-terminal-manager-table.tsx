import { DataTable } from "./data-table.tsx";
import { columns} from "./columns.tsx";
import { berthRequestDecision, deleteBerthRequest } from "../berth-request-client.tsx";

interface TerminalOperatorBerthRequestsTableProps {
  data: any[];
  refresh: any;
}
export function TerminalOperatorBerthRequestsTable({ data, refresh}: TerminalOperatorBerthRequestsTableProps) {
const decideBerthRequest = (requestId: string, decision:string) =>{
  
  berthRequestDecision(requestId, decision);

}
const delBerthRequest = (requestId: string) =>{
  
  deleteBerthRequest(requestId);
  refresh();
}

  return (
    <div className="container mx-auto p-10 overflow-x-auto">
      <DataTable columns={columns} data={data} meta = {{decideBerthRequest, deleteBerthRequest:delBerthRequest}}/>
    </div>
  );
}


