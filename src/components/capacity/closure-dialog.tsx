import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createClosure, OpenInterval, updateTerminalResource } from "../terminal-resource/terminal-resource-manager-client"
import type { ClosureDomain } from "../terminal-resource/closure-domain"
import { formatDate } from "../terminal-resource/capacity-format"
import { Input } from "../ui/input"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Label } from "../ui/label"
import { Field, FormDialog } from "./form-dialog"
import { IntervalEditor } from "./interval-editor"
import { intervalsProblem } from "./capacity-rules"
import type { Row } from "./use-capacity-data"

// C-1: a holiday or closure date, closed all day or with reduced hours. The date can't change once saved.
export function ClosureDialog({ terminalId, closure, open, onClose, onDone }: {
  terminalId: string
  closure: Row<ClosureDomain> | null   // null = add
  open: boolean
  onClose: () => void
  onDone: () => void | Promise<void>
}) {
  const [date, setDate] = useState("")
  const [reason, setReason] = useState("")
  const [reduced, setReduced] = useState(false)
  const [intervals, setIntervals] = useState<OpenInterval[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const r = closure?.record
    setDate(r?.date ?? "")
    setReason(r?.reason ?? "")
    setReduced(Boolean(r?.openIntervals?.length))
    setIntervals(r?.openIntervals?.length ? r.openIntervals.map((i) => ({ ...i })) : [{ open: "07:00", close: "12:00" }])
    setError(null)
  }, [open, closure])

  const problem = reduced ? intervalsProblem(intervals, "Reduced hours") : null
  const canSubmit = Boolean(date && reason.trim()) && !problem

  async function handleSave() {
    setIsSubmitting(true)
    setError(null)
    const fields = { reason: reason.trim(), openIntervals: reduced ? intervals : [] }
    try {
      if (closure) {
        await updateTerminalResource({ terminalId, sk: closure.sk, record: fields })
      } else {
        await createClosure({ terminalId, date, ...fields })
      }
      toast.success(`Closure on ${formatDate(date)} saved`)
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
      title={closure ? "Edit Closure" : "Add Closure"}
      submitLabel={closure ? "Save Closure" : "Add Closure"}
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      error={error ?? problem}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <Field label="Date" htmlFor="closure-date" required hint={date ? formatDate(date) : undefined}>
        <Input id="closure-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={Boolean(closure)} required />
      </Field>
      <Field label="Reason" htmlFor="closure-reason" required>
        <Input id="closure-reason" value={reason} maxLength={100} onChange={(e) => setReason(e.target.value)} placeholder="For example: Christmas Day" required />
      </Field>
      <Field label="Hours that day" required>
        <RadioGroup value={reduced ? "reduced" : "closed"} onValueChange={(v) => setReduced(v === "reduced")} className="grid gap-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="closed" id="closure-closed" />
            <Label htmlFor="closure-closed">Closed all day</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="reduced" id="closure-reduced" />
            <Label htmlFor="closure-reduced">Reduced hours</Label>
          </div>
        </RadioGroup>
      </Field>
      {reduced && <IntervalEditor id="closure-hours" intervals={intervals} onChange={setIntervals} addLabel="Add a break" />}
    </FormDialog>
  )
}
