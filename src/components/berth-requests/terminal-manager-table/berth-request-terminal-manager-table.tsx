import { DataTable } from "./data-table.tsx";
import { columns} from "./columns.tsx";
import { berthRequestDecision } from "../berth-request-client.tsx";

interface TerminalOperatorBerthRequestsTableProps {
  data: any[];
}
export function TerminalOperatorBerthRequestsTable({ data}: TerminalOperatorBerthRequestsTableProps) {
const decideBerthRequest = (requestId: string, decision:string) =>{
  
  //data.find(value => value.requestId === requestId)['status'] = decision;
  berthRequestDecision(requestId, decision);

}
  return (
    <div className="container mx-auto p-10 overflow-x-auto">
      <DataTable columns={columns} data={data} meta = {{decideBerthRequest}}/>
    </div>
  );
}


