import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs.tsx";
import { DataTable } from "./data-table.tsx";
import {
  requestedColumns,
  modificationRequestedColumns,
  ongoingColumns,
  completedColumns,
} from "./columns.tsx";
import { BerthConfigDomain } from "../berth-config-domain.tsx";

interface TerminalOperatorBerthRequestsTableProps {
  data: any[];
  deleteBerthRequest: any;
  berthConfigs: BerthConfigDomain[];
  modifyBerthRequest: any;
  decideBerthRequest: any;
}

export function TerminalOperatorBerthRequestsTable({
  data,
  deleteBerthRequest,
  berthConfigs,
  modifyBerthRequest,
  decideBerthRequest,
}: TerminalOperatorBerthRequestsTableProps) {
  

  

  const requested             = data.filter((r) => r.status === "REQUESTED")
  const modificationRequested = data.filter((r) => r.status === "MODIFIED")
  const ongoing               = data.filter((r) =>
    r.status === "APPROVED" && (!r.ataAt || !r.atdAt)
  )
  const completed             = data.filter((r) =>
    r.status === "DENIED" ||
    (r.status === "APPROVED" && r.ataAt && r.atdAt)
  )

  const meta = { decideBerthRequest, deleteBerthRequest, berthConfigs, modifyBerthRequest }

  return (
    <Tabs defaultValue="requested">
      <TabsList className="flex flex-wrap items-stretch justify-normal gap-x-6 gap-y-2 w-full h-auto min-h-[1.875rem] sm:h-[1.875rem] mb-4 p-0 bg-transparent border-b border-gray-200">
        <TabsTrigger value="requested" className="data-[state=active]:sm:-mb-px pt-0 px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none text-gray-500 hover:text-gray-700 data-[state=active]:text-gray-900 data-[state=active]:shadow-none">Requested</TabsTrigger>
        <TabsTrigger value="modification-requested" className="data-[state=active]:sm:-mb-px pt-0 px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none text-gray-500 hover:text-gray-700 data-[state=active]:text-gray-900 data-[state=active]:shadow-none">Modification Requested</TabsTrigger>
        <TabsTrigger value="ongoing" className="data-[state=active]:sm:-mb-px pt-0 px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none text-gray-500 hover:text-gray-700 data-[state=active]:text-gray-900 data-[state=active]:shadow-none">Ongoing</TabsTrigger>
        <TabsTrigger value="completed" className="data-[state=active]:sm:-mb-px pt-0 px-0 pb-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-gray-900 rounded-none text-gray-500 hover:text-gray-700 data-[state=active]:text-gray-900 data-[state=active]:shadow-none">Completed</TabsTrigger>
      </TabsList>
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
    </Tabs>
  );
}
