import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createUnit, updateTerminalResource } from "../terminal-resource/terminal-resource-manager-client"
import type { EquipmentDomain } from "../terminal-resource/equipment-domain"
import type { UnitDomain } from "../terminal-resource/unit-domain"
import { Checkbox } from "../ui/checkbox"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Field, FormDialog } from "./form-dialog"
import type { Row } from "./use-capacity-data"

// C-2: a named piece of equipment (Forklift 1). Short breakdowns are outages, not "out of service".
export function UnitDialog({ terminalId, unit, equipmentTypes, open, onClose, onDone }: {
  terminalId: string
  unit: Row<UnitDomain> | null   // null = add
  equipmentTypes: Row<EquipmentDomain>[]
  open: boolean
  onClose: () => void
  onDone: () => void | Promise<void>
}) {
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [inService, setInService] = useState(true)
  const [duration, setDuration] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const r = unit?.record
    setName(r?.name ?? "")
    setType(r?.equipmentType?.toUpperCase() ?? "")
    setInService(r?.inService ?? true)
    setDuration(r?.defaultDurationMins ? String(r.defaultDurationMins) : "")
    setNotes(r?.notes ?? "")
    setError(null)
  }, [open, unit])

  // Active types, plus the unit's current type even if it has since been made inactive.
  const choices = equipmentTypes.filter((t) => t.record.active !== false || t.record.equipmentType === type)
  const mins = duration.trim() === "" ? null : Number(duration)
  const problem = mins !== null && (!Number.isInteger(mins) || mins < 1 || mins > 1440) ? "Duration override must be 1 to 1440 minutes, or blank." : null
  const canSubmit = Boolean(name.trim() && type) && !problem

  async function handleSave() {
    setIsSubmitting(true)
    setError(null)
    const fields = { name: name.trim(), equipmentType: type, inService, defaultDurationMins: mins, notes: notes.trim() || null }
    try {
      if (unit) {
        await updateTerminalResource({ terminalId, sk: unit.sk, record: fields })
      } else {
        await createUnit({ terminalId, ...fields, defaultDurationMins: mins ?? undefined, notes: fields.notes ?? undefined })
      }
      toast.success(`${fields.name} saved`)
      await onDone()
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedType = equipmentTypes.find((t) => t.record.equipmentType === type)?.record

  return (
    <FormDialog
      open={open}
      title={unit ? "Edit Unit" : "Add Unit"}
      submitLabel={unit ? "Save Unit" : "Add Unit"}
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      error={error ?? problem}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <Field label="Name" htmlFor="unit-name" required>
        <Input id="unit-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="For example: Forklift 2" required />
      </Field>
      <Field label="Equipment type" required>
        {choices.length === 0 ? (
          <p className="text-sm text-amber-800">Add an equipment type first.</p>
        ) : (
          <Select value={type} onValueChange={setType}>
            <SelectTrigger aria-label="Equipment type"><SelectValue placeholder="Choose a type" /></SelectTrigger>
            <SelectContent>
              {choices.map((t) => (
                <SelectItem key={t.record.equipmentType} value={t.record.equipmentType}>{t.record.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Field>
      <Field
        label="Duration override (minutes)"
        htmlFor="unit-duration"
        hint={selectedType ? `Leave blank to use the ${selectedType.label} default of ${selectedType.defaultDurationMins} minutes.` : "Leave blank to use the type's default."}
      >
        <Input id="unit-duration" type="number" min={1} max={1440} step={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={inService} onCheckedChange={(v) => setInService(v === true)} />
        In service (uncheck for long-term removal; use an outage for a short break)
      </label>
      <Field label="Notes" htmlFor="unit-notes">
        <Textarea id="unit-notes" value={notes} maxLength={500} rows={2} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </FormDialog>
  )
}
