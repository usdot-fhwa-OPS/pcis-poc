import { useCallback, useEffect, useState } from "react"
import { listTerminalHours, listTerminalResource, TerminalHours } from "../terminal-resource/terminal-resource-manager-client"
import type { TerminalResourceDomian } from "../terminal-resource/terminal-resource-domain"
import type { EquipmentDomain } from "../terminal-resource/equipment-domain"
import type { UnitDomain } from "../terminal-resource/unit-domain"
import type { GangDomain } from "../terminal-resource/gang-domain"
import type { ClosureDomain } from "../terminal-resource/closure-domain"
import type { OutageDomain } from "../terminal-resource/outage-domain"

export type Row<T> = TerminalResourceDomian & { record: T }

export type TerminalResources = {
  equipmentTypes: Row<EquipmentDomain>[]
  units: Row<UnitDomain>[]
  gangs: Row<GangDomain>[]
  closures: Row<ClosureDomain>[]
  outages: Row<OutageDomain>[]
}

// Loads every terminal the TO can see (hours from BerthConfig, resources from TerminalResources) in two calls.
export function useCapacityData() {
  const [hours, setHours] = useState<TerminalHours[]>([])
  const [items, setItems] = useState<TerminalResourceDomian[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      const [h, r] = await Promise.all([listTerminalHours(), listTerminalResource()])
      setHours(h.sort((a, b) => (a.terminalName ?? a.terminalId).localeCompare(b.terminalName ?? b.terminalId)))
      setItems(r)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reload() }, [reload])

  const resourcesFor = useCallback((terminalId: string): TerminalResources => {
    const of = <T,>(prefix: string) =>
      items.filter((i) => i.terminalId === terminalId && i.sk.startsWith(prefix)) as Row<T>[]
    const byName = <T extends { name?: string, label?: string }>(a: Row<T>, b: Row<T>) =>
      (a.record.name ?? a.record.label ?? "").localeCompare(b.record.name ?? b.record.label ?? "", undefined, { numeric: true })
    return {
      equipmentTypes: of<EquipmentDomain>("EQTYPE#").sort(byName),
      units: of<UnitDomain>("UNIT#").sort(byName),
      gangs: of<GangDomain>("GANG#").sort(byName),
      closures: of<ClosureDomain>("CLOSURE#").sort((a, b) => a.record.date.localeCompare(b.record.date)),
      outages: of<OutageDomain>("OUTAGE#").sort((a, b) => a.record.startAt.localeCompare(b.record.startAt)),
    }
  }, [items])

  return { hours, loading, error, reload, resourcesFor }
}
