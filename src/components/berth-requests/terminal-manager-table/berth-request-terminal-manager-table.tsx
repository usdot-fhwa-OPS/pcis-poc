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
    <div className="container mx-auto p-10 overflow-x-auto">
      <Tabs defaultValue="requested">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="flex justify-start gap-x-4">
            <TabsTrigger value="requested">Requested</TabsTrigger>
            <TabsTrigger value="modification-requested">Modification Requested</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <Button onClick={() => setBerthAvailabilityOpen(true)}>Set Berth Availability</Button>
        </div>
        <BerthAvailability isDialogOpen={berthAvailabilityOpen} handleCloseDialog={setBerthAvailabilityOpen} />
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
