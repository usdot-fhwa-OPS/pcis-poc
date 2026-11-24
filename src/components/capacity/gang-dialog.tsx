import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createGang, updateTerminalResource } from "../terminal-resource/terminal-resource-manager-client"
import type { EquipmentDomain } from "../terminal-resource/equipment-domain"
import type { GangDomain } from "../terminal-resource/gang-domain"
import { Checkbox } from "../ui/checkbox"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { Field, FormDialog } from "./form-dialog"
import type { Row } from "./use-capacity-data"
import { gangTypes } from "./capacity-rules"

// C-3: gangs are general crews the TO assigns at their discretion. The equipment list is only a hint
// that puts this gang first in the review picker for those types.
export function GangDialog({ terminalId, gang, equipmentTypes, open, onClose, onDone }: {
  terminalId: string
  gang: Row<GangDomain> | null   // null = add
  equipmentTypes: Row<EquipmentDomain>[]
  open: boolean
  onClose: () => void
  onDone: () => void | Promise<void>
}) {
  const [name, setName] = useState("")
  const [types, setTypes] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(gang?.record.name ?? "")
    setTypes(gang ? gangTypes(gang.record) : [])
    setNotes(gang?.record.notes ?? "")
    setError(null)
  }, [open, gang])

  const toggle = (code: string, on: boolean) =>
    setTypes(on ? [...types, code] : types.filter((t) => t !== code))

  async function handleSave() {
    setIsSubmitting(true)
    setError(null)
    const fields = { name: name.trim(), equipmentTypes: types, notes: notes.trim() || null }
    try {
      if (gang) {
        await updateTerminalResource({ terminalId, sk: gang.sk, record: fields })
      } else {
        await createGang({ terminalId, ...fields, notes: fields.notes ?? undefined })
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

  return (
    <FormDialog
      open={open}
      title={gang ? "Edit Gang" : "Add Gang"}
      submitLabel={gang ? "Save Gang" : "Add Gang"}
      isSubmitting={isSubmitting}
      canSubmit={Boolean(name.trim())}
      error={error}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <Field label="Name" htmlFor="gang-name" required>
        <Input id="gang-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} placeholder="For example: Gang A" required />
      </Field>
      {equipmentTypes.length > 0 && (
        <Field label="Usually works (optional)" hint="Only changes the order of the gang list when you review a request. Any gang can be assigned to any visit.">
          <div className="grid grid-cols-2 gap-2">
            {equipmentTypes.map((t) => (
              <label key={t.record.equipmentType} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={types.includes(t.record.equipmentType)}
                  onCheckedChange={(v) => toggle(t.record.equipmentType, v === true)}
                />
                {t.record.label}
              </label>
            ))}
          </div>
        </Field>
      )}
      <Field label="Notes" htmlFor="gang-notes">
        <Textarea id="gang-notes" value={notes} maxLength={500} rows={2} onChange={(e) => setNotes(e.target.value)} />
      </Field>
    </FormDialog>
  )
}
