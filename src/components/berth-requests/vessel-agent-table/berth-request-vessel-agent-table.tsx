import { useState } from "react";
import { DataTable } from "./data-table.tsx";
import {
  requestedColumns,
  modificationRequestedColumns,
  ongoingColumns,
  completedColumns,
} from "./columns.tsx";
import { BerthConfigDomain } from "../berth-config-domain.tsx";

interface VesselAgentBerthRequestsTableProps {
  data: any[];
  meta: { brConfigList: BerthConfigDomain[], deleteBerthRequest: any };
}

type TabKey = "requested" | "modification-requested" | "ongoing" | "completed"

const TABS: { key: TabKey; label: string }[] = [
  { key: "requested", label: "Requested" },
  { key: "modification-requested", label: "Modification Requested" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
]

export function VesselAgentBerthRequestsTable({ data, meta }: VesselAgentBerthRequestsTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("requested")

  const requested             = data.filter((r) => r.status === "REQUESTED")
  const modificationRequested = data.filter((r) => r.status === "MODIFIED")
  const ongoing               = data.filter((r) =>
    r.status === "APPROVED" && (!r.ataAt || !r.atdAt)
  )
  const completed             = data.filter((r) =>
    r.status === "DENIED" ||
    (r.status === "APPROVED" && r.ataAt && r.atdAt)
  )

  const tabConfig: Record<TabKey, { columns: any; data: any[] }> = {
    "requested":              { columns: requestedColumns, data: requested },
    "modification-requested": { columns: modificationRequestedColumns, data: modificationRequested },
    "ongoing":                { columns: ongoingColumns, data: ongoing },
    "completed":              { columns: completedColumns, data: completed },
  }

  const current = tabConfig[activeTab]

  return (
    <div className="w-full pt-0 px-6 md:px-10 pb-6 md:pb-8">
      {/* Tab navigation */}
      <div className="mb-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-2 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "text-gray-900 border-b-2 border-gray-900 -mb-px"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table — columns change per tab */}
      <DataTable columns={current.columns} data={current.data} meta={meta} />
    </div>
  );
}
