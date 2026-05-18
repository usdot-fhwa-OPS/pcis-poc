import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs.tsx";
import { DataTable } from "./data-table.tsx";
import {
  requestedColumns,
  modificationRequestedColumns,
  ongoingColumns,
  completedColumns,
} from "./columns.tsx";
import { berthRequestDecision } from "../berth-request-client.tsx";

interface TerminalOperatorBerthRequestsTableProps {
  data: any[];
  deleteBerthRequest: any;
}

export function TerminalOperatorBerthRequestsTable({
  data,
  deleteBerthRequest,
}: TerminalOperatorBerthRequestsTableProps) {
  const decideBerthRequest = (requestId: string, decision: string) => {
    berthRequestDecision(requestId, decision);
  }

  const requested             = data.filter((r) => r.status === "Pending Approval")
  const modificationRequested = data.filter((r) => r.status === "Modification Requested")
  const ongoing               = data.filter((r) => r.status === "Ongoing")
  const completed             = data.filter((r) => r.status === "Denied" || r.status === "Complete")

  const meta = { decideBerthRequest, deleteBerthRequest }

  return (
    <div className="container mx-auto p-10 overflow-x-auto">
      <Tabs defaultValue="requested">
        <div>
          <TabsList className="mb-4 flex w-full justify-start gap-x-4">
            <TabsTrigger value="requested">Requested</TabsTrigger>
            <TabsTrigger value="modification-requested">Modification Requested</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </div>
        <div className="w-xl max-w-9/10">
          <TabsContent value="requested">
            <DataTable columns={requestedColumns} data={requested} meta={meta} />
          </TabsContent>
          <TabsContent value="modification-requested">
            <DataTable columns={modificationRequestedColumns} data={modificationRequested} meta={meta} />
          </TabsContent>
          <TabsContent value="ongoing">
            <DataTable columns={ongoingColumns} data={ongoing} meta={meta} />
          </TabsContent>
          <TabsContent value="completed">
            <DataTable columns={completedColumns} data={completed} meta={meta} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
