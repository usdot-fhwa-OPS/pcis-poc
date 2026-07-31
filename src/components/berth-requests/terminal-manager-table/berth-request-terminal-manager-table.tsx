import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs.tsx";
import { DataTable } from "./data-table.tsx";
import {
  requestedColumns,
  modificationRequestedColumns,
  ongoingColumns,
  completedColumns,
} from "./columns.tsx";
import { BerthConfigDomain } from "../berth-config-domain.tsx";
import { Button } from "../../ui/button.tsx";
import { BerthAvailability } from "../../berth/berth-availability.tsx";

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

  const [berthAvailabilityOpen, setBerthAvailabilityOpen] = useState(false)
  const meta = { decideBerthRequest, deleteBerthRequest, berthConfigs, modifyBerthRequest }

  return (
    <div>
      <Button onClick={() => setBerthAvailabilityOpen(true)}>Set Berth Availability</Button>
      <BerthAvailability isDialogOpen={berthAvailabilityOpen} handleCloseDialog={setBerthAvailabilityOpen} />
      <Tabs defaultValue="requested">
        <TabsList className="flex justify-start gap-x-4">
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
    </div>
  );
}
