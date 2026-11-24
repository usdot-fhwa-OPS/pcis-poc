import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useCapacityData } from "../components/capacity/use-capacity-data"
import { HoursTab } from "../components/capacity/hours-tab"
import { EquipmentTab } from "../components/capacity/equipment-tab"
import { GangsTab } from "../components/capacity/gangs-tab"
import { OutagesTab } from "../components/capacity/outages-tab"

export const Route = createFileRoute('/capacity')({
  component: CapacityPlanningPage,
})

// C-8: one page for a Terminal Operator to manage hours and closures (C-1), equipment (C-2),
// gangs (C-3) and outages (C-4). Everything is scoped to the selected terminal.
export default function CapacityPlanningPage() {
  const { hours, loading, error, reload, resourcesFor } = useCapacityData()
  const [terminalId, setTerminalId] = useState("")
  const [tab, setTab] = useState("hours")

  useEffect(() => {
    if (!terminalId && hours.length) setTerminalId(hours[0].terminalId)
  }, [hours, terminalId])

  const terminal = hours.find((t) => t.terminalId === terminalId)
  const resources = terminal ? resourcesFor(terminal.terminalId) : null

  return (
    <div className="w-full px-6 py-6 md:px-10 md:py-8">
      <div className="mb-6 flex max-sm:flex-col items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-none font-semibold text-gray-900">Capacity Planning</h1>
          {terminal && (
            <p className="mt-2 text-sm text-gray-600">{terminal.terminalName ?? terminal.terminalId}</p>
          )}
        </div>
        {hours.length > 1 && (
          <Select value={terminalId} onValueChange={setTerminalId}>
            <SelectTrigger className="w-72" aria-label="Terminal"><SelectValue placeholder="Choose a terminal" /></SelectTrigger>
            <SelectContent>
              {hours.map((t) => (
                <SelectItem key={t.terminalId} value={t.terminalId}>{t.terminalName ?? t.terminalId}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-500">Loading capacity settings…</div>
      ) : error ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Capacity settings couldn't be loaded: {error}
        </p>
      ) : !terminal || !resources ? (
        <p className="text-gray-600">Your account isn't linked to a terminal yet.</p>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="hours">Hours &amp; Closures</TabsTrigger>
            <TabsTrigger value="equipment">Equipment</TabsTrigger>
            <TabsTrigger value="gangs">Gangs</TabsTrigger>
            <TabsTrigger value="outages">Outages</TabsTrigger>
          </TabsList>
          <TabsContent value="hours">
            <HoursTab terminal={terminal} closures={resources.closures} reload={reload} />
          </TabsContent>
          <TabsContent value="equipment">
            <EquipmentTab terminalId={terminal.terminalId} equipmentTypes={resources.equipmentTypes} units={resources.units} reload={reload} />
          </TabsContent>
          <TabsContent value="gangs">
            <GangsTab terminalId={terminal.terminalId} gangs={resources.gangs} equipmentTypes={resources.equipmentTypes} reload={reload} />
          </TabsContent>
          <TabsContent value="outages">
            <OutagesTab
              terminalId={terminal.terminalId}
              timezone={terminal.timezone}
              outages={resources.outages}
              units={resources.units}
              gangs={resources.gangs}
              reload={reload}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
