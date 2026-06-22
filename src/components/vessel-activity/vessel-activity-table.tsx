import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { BerthRequestDomain } from "../berth-requests/berth-request-domain"
import { isVesselArchived, isBerthPending, needsAttention } from "./vessel-activity-types"
import { allColumns, inboundColumns, outboundColumns } from "./columns"
import { DataTable } from "./data-table"
import { Checkbox } from "../ui/checkbox"

interface VesselActivityTableProps {
  data: BerthRequestDomain[]
}

type TabKey = "all" | "inbound" | "outbound"
type FilterKey = "all" | "needs-attention" | "berth-pending" | "cleared"

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Vessel Activity" },
  { key: "inbound", label: "Inbound Vessels" },
  { key: "outbound", label: "Outbound Vessels" },
]

export function VesselActivityTable({ data }: VesselActivityTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all")
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all")
  const [includeArchived, setIncludeArchived] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Base data: archived filter applied.
  const baseData = useMemo(() => {
    if (includeArchived) return data
    return data.filter((r) => !isVesselArchived(r))
  }, [data, includeArchived])

  // Tab-filtered data: inbound = no ATA yet, outbound = ATA set but no ATD yet.
  const tabData = useMemo(() => {
    if (activeTab === "inbound") return baseData.filter((r) => !r.ataAt)
    if (activeTab === "outbound") return baseData.filter((r) => !!r.ataAt && !r.atdAt)
    return baseData
  }, [baseData, activeTab])

  // Chip counts from tab-filtered data (before chip filter).
  // TODO: Pass real hazmatCount per item once the backend provides it.
  const counts = useMemo(() => ({
    all: tabData.length,
    needsAttention: tabData.filter((r) => needsAttention(r, 0)).length,
    berthPending: tabData.filter(isBerthPending).length,
    cleared: tabData.filter(isVesselArchived).length,
  }), [tabData])

  // Final data: tab + chip filter + vessel search.
  const filteredData = useMemo(() => {
    let d = tabData

    if (activeFilter === "needs-attention") {
      d = d.filter((r) => needsAttention(r, 0))
    } else if (activeFilter === "berth-pending") {
      d = d.filter(isBerthPending)
    } else if (activeFilter === "cleared") {
      d = d.filter(isVesselArchived)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      d = d.filter((r) => r.vesselID?.toLowerCase().includes(q))
    }

    return d
  }, [tabData, activeFilter, searchQuery])

  const FILTERS: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "needs-attention", label: "Needs Attention", count: counts.needsAttention },
    { key: "berth-pending", label: "Berth Pending", count: counts.berthPending },
    { key: "cleared", label: "Cleared", count: counts.cleared },
  ]

  const activeColumns =
    activeTab === "inbound" ? inboundColumns
    : activeTab === "outbound" ? outboundColumns
    : allColumns

  return (
    <div className="flex flex-col gap-4">
      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
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

      {/* Filter chips + archived toggle + search — all in one row */}
      <div className="flex items-center gap-2 p-2 bg-white border rounded-xl">
        {FILTERS.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeFilter === key
                ? "bg-gray-900 text-white"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {label} {count}
          </button>
        ))}
        <label className="flex items-center gap-2 cursor-pointer select-none ml-1 whitespace-nowrap">
          <Checkbox
            checked={includeArchived}
            onCheckedChange={(checked) => {
              setIncludeArchived(!!checked)
              if (!checked && activeFilter === "cleared") setActiveFilter("all")
            }}
          />
          <span className="text-sm text-gray-700">Include Archived Items</span>
        </label>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search vessels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent w-48"
          />
        </div>
      </div>

      {/* Table — columns change per tab */}
      <DataTable columns={activeColumns} data={filteredData} />
    </div>
  )
}
