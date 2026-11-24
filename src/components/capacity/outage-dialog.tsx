import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createOutage, updateTerminalResource } from "../terminal-resource/terminal-resource-manager-client"
import type { GangDomain } from "../terminal-resource/gang-domain"
import type { OutageDomain } from "../terminal-resource/outage-domain"
import type { UnitDomain } from "../terminal-resource/unit-domain"
import { OUTAGE_REASONS } from "../terminal-resource/capacity-format"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "../ui/select"
import { Field, FormDialog } from "./form-dialog"
import { RecurrenceEditor } from "./recurrence-editor"
import { Recurrence, recurrenceProblem } from "./capacity-rules"
import type { Row } from "./use-capacity-data"

const OTHER = "__other__"

// C-4: takes a unit or a gang offline, once or on a repeating schedule. While offline it can't be
// assigned to a visit. Times are the terminal's local time.
export function OutageDialog({ terminalId, timezone, outage, units, gangs, open, onClose, onDone }: {
  terminalId: string
  timezone: string | null
  outage: Row<OutageDomain> | null   // null = add
  units: Row<UnitDomain>[]
  gangs: Row<GangDomain>[]
  open: boolean
  onClose: () => void
  onDone: () => void | Promise<void>
}) {
  const [target, setTarget] = useState("")          // "UNIT#<id>" or "GANG#<id>"
  const [reasonChoice, setReasonChoice] = useState(OUTAGE_REASONS[0])
  const [otherReason, setOtherReason] = useState("")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("08:00")
  const [endDate, setEndDate] = useState("")
  const [endTime, setEndTime] = useState("12:00")
  const [recurrence, setRecurrence] = useState<Recurrence | undefined>(undefined)
  const [daysText, setDaysText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const r = outage?.record
    setTarget(r ? `${r.resourceType}#${r.resourceId}` : "")
    const known = r && OUTAGE_REASONS.includes(r.reason)
    setReasonChoice(r ? (known ? r.reason : OTHER) : OUTAGE_REASONS[0])
    setOtherReason(r && !known ? r.reason : "")
    setStartDate(r?.startAt.slice(0, 10) ?? "")
    setStartTime(r?.startAt.slice(11, 16) ?? "08:00")
    setEndDate(r?.endAt.slice(0, 10) ?? "")
    setEndTime(r?.endAt.slice(11, 16) ?? "12:00")
    setRecurrence(r?.recurrence ? structuredClone(r.recurrence) : undefined)
    setDaysText(r?.recurrence?.daysOfMonth?.join(", ") ?? "")
    setError(null)
  }, [open, outage])

  const reason = reasonChoice === OTHER ? otherReason.trim() : reasonChoice
  const effectiveEndDate = endDate || startDate
  const startAt = startDate && startTime ? `${startDate}T${startTime}:00` : ""
  const endAt = effectiveEndDate && endTime ? `${effectiveEndDate}T${endTime}:00` : ""
  const problem =
    startAt && endAt && endAt <= startAt ? "The outage must end after it starts." :
    recurrenceProblem(recurrence, startDate)
  const canSubmit = Boolean(target && reason && startAt && endAt) && !problem

  // Live units and gangs only (the server refuses an outage on a deleted one).
  const liveUnits = units.filter((u) => u.record.active !== false)
  const liveGangs = gangs.filter((g) => g.record.active !== false)

  async function handleSave() {
    setIsSubmitting(true)
    setError(null)
    const [resourceType, resourceId] = target.split("#")
    const fields = { resourceType, resourceId, reason, startAt, endAt, recurrence: recurrence ?? null }
    try {
      if (outage) {
        await updateTerminalResource({ terminalId, sk: outage.sk, record: fields })
      } else {
        await createOutage({ terminalId, ...fields, recurrence })
      }
      toast.success("Outage saved")
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
      wide
      title={outage ? "Edit Outage" : "Add Outage"}
      submitLabel={outage ? "Save Outage" : "Add Outage"}
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      error={error ?? problem}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <Field label="Unit or gang" required hint="While it's offline, it can't be assigned to a visit.">
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger aria-label="Unit or gang"><SelectValue placeholder="Choose a unit or gang" /></SelectTrigger>
          <SelectContent>
            {liveUnits.length > 0 && (
              <SelectGroup>
                <SelectLabel>Units</SelectLabel>
                {liveUnits.map((u) => <SelectItem key={u.sk} value={u.sk}>{u.record.name}</SelectItem>)}
              </SelectGroup>
            )}
            {liveGangs.length > 0 && (
              <SelectGroup>
                <SelectLabel>Gangs</SelectLabel>
                {liveGangs.map((g) => <SelectItem key={g.sk} value={g.sk}>{g.record.name}</SelectItem>)}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Reason" required>
        <Select value={reasonChoice} onValueChange={setReasonChoice}>
          <SelectTrigger aria-label="Reason"><SelectValue /></SelectTrigger>
          <SelectContent>
            {OUTAGE_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            <SelectItem value={OTHER}>Other…</SelectItem>
          </SelectContent>
        </Select>
        {reasonChoice === OTHER && (
          <Input aria-label="Other reason" value={otherReason} maxLength={200} onChange={(e) => setOtherReason(e.target.value)} placeholder="Describe the reason" />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts" htmlFor="outage-start-date" required>
          <div className="flex gap-2">
            <Input id="outage-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            <Input type="time" aria-label="Start time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-32" required />
          </div>
        </Field>
        <Field label="Ends" htmlFor="outage-end-date" required hint="Blank date = same day.">
          <div className="flex gap-2">
            <Input id="outage-end-date" type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
            <Input type="time" aria-label="End time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-32" required />
          </div>
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        Terminal local time{timezone ? ` (${timezone})` : ""}. For a repeating outage, these are the first occurrence.
      </p>

      <RecurrenceEditor value={recurrence} onChange={setRecurrence} daysText={daysText} setDaysText={setDaysText} startDate={startDate} />
    </FormDialog>
  )
}
