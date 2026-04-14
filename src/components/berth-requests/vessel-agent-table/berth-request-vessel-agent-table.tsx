import { DataTable } from "./data-table.tsx";
import { columns} from "./columns.tsx";
import { BerthConfigDomain } from "../berth-config-domain.tsx";

interface VesselAgentBerthRequestsTableProps {
  data: any[];
  meta: {brConfigList: BerthConfigDomain[]};
}

export function VesselAgentBerthRequestsTable({ data, meta}: VesselAgentBerthRequestsTableProps) {
  return (
    <div className="container mx-auto p-10 overflow-x-auto">
      <DataTable columns={columns} data={data} meta={meta}/>
    </div>
  );
}


