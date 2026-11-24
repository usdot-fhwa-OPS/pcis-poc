import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createEquipment, updateTerminalResource } from "../terminal-resource/terminal-resource-manager-client"
import type { EquipmentDomain } from "../terminal-resource/equipment-domain"
import { Checkbox } from "../ui/checkbox"
import { Input } from "../ui/input"
import { Field, FormDialog } from "./form-dialog"
import type { Row } from "./use-capacity-data"
import { toEquipmentCode } from "./capacity-rules"

// C-2: an equipment type with its default job length. Its code is fixed once created.
export function EquipmentTypeDialog({ terminalId, equipmentType, open, onClose, onDone }: {
  terminalId: string
  equipmentType: Row<EquipmentDomain> | null   // null = add
  open: boolean
  onClose: () => void
  onDone: () => void | Promise<void>
}) {
  const [label, setLabel] = useState("")
  const [duration, setDuration] = useState("60")
  const [gangs, setGangs] = useState("1")
  const [active, setActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const r = equipmentType?.record
    setLabel(r?.label ?? "")
    setDuration(String(r?.defaultDurationMins ?? 60))
    setGangs(String(r?.gangsRequired ?? 1))
    setActive(r?.active ?? true)
    setError(null)
  }, [open, equipmentType])

  const code = equipmentType?.record.equipmentType ?? toEquipmentCode(label)
  const mins = Number(duration)
  const gangCount = Number(gangs)
  const problem =
    !Number.isInteger(mins) || mins < 1 || mins > 1440 ? "Default duration must be 1 to 1440 minutes." :
    !Number.isInteger(gangCount) || gangCount < 0 || gangCount > 10 ? "Gangs per job must be 0 to 10." :
    label.trim() && !/^[A-Z]/.test(code) ? "The name must start with a letter." : null
  const canSubmit = Boolean(label.trim()) && !problem

  async function handleSave() {
    setIsSubmitting(true)
    setError(null)
    const fields = { label: label.trim(), defaultDurationMins: mins, gangsRequired: gangCount, active }
    try {
      if (equipmentType) {
        await updateTerminalResource({ terminalId, sk: equipmentType.sk, record: fields })
      } else {
        await createEquipment({ terminalId, equipmentType: code, ...fields })
      }
      toast.success(`${fields.label} saved`)
      await onDone()
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={open}
      title={equipmentType ? "Edit Equipment Type" : "Add Equipment Type"}
      submitLabel={equipmentType ? "Save Equipment Type" : "Add Equipment Type"}
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      error={error ?? (label.trim() ? problem : null)}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <Field label="Name" htmlFor="eqtype-label" required hint={code ? `Code: ${code}${equipmentType ? " (can't be changed)" : ""}` : undefined}>
        <Input id="eqtype-label" value={label} maxLength={100} onChange={(e) => setLabel(e.target.value)} placeholder="For example: Heavy-Lift Crane" required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Default duration (minutes)" htmlFor="eqtype-duration" required>
          <Input id="eqtype-duration" type="number" min={1} max={1440} step={1} value={duration} onChange={(e) => setDuration(e.target.value)} required />
        </Field>
        <Field label="Gangs per job" htmlFor="eqtype-gangs" required>
          <Input id="eqtype-gangs" type="number" min={0} max={10} step={1} value={gangs} onChange={(e) => setGangs(e.target.value)} required />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={active} onCheckedChange={(v) => setActive(v === true)} />
        Offered on new reservation requests
      </label>
    </FormDialog>
  )
}
