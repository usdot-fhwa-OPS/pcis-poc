import { useEffect, useState } from "react"
import { toast } from "sonner"
import { saveTerminalHours, TerminalHours, WeeklyHours } from "../terminal-resource/terminal-resource-manager-client"
import { DAYS, DAY_LABELS } from "../terminal-resource/capacity-format"
import { Checkbox } from "../ui/checkbox"
import { FormDialog } from "./form-dialog"
import { IntervalEditor } from "./interval-editor"
import { intervalsProblem } from "./capacity-rules"

// C-1: edits BerthConfig.weeklyHours only. A day with no open periods is closed.
export function WeeklyHoursDialog({ terminal, open, onClose, onDone }: {
  terminal: TerminalHours
  open: boolean
  onClose: () => void
  onDone: () => void | Promise<void>
}) {
  const [hours, setHours] = useState<WeeklyHours>(terminal.weeklyHours)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) { setHours(structuredClone(terminal.weeklyHours)); setError(null) }
  }, [open, terminal])

  const problem = DAYS.map((d) => intervalsProblem(hours[d], DAY_LABELS[d])).find(Boolean) ?? null

  async function handleSave() {
    setIsSubmitting(true)
    setError(null)
    try {
      await saveTerminalHours(terminal.terminalId, hours)
      toast.success("Weekly hours saved")
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
      title="Edit Weekly Hours"
      submitLabel="Save Hours"
      isSubmitting={isSubmitting}
      canSubmit={!problem}
      error={error ?? problem}
      onClose={onClose}
      onSubmit={handleSave}
    >
      <p className="text-gray-600">
        Times are in the terminal's local time{terminal.timezone ? ` (${terminal.timezone})` : ""}. Use holiday and
        closure dates below for one-off changes.
      </p>
      <div className="grid gap-3">
        {DAYS.map((day) => {
          const closed = hours[day].length === 0
          return (
            <div key={day} className="grid grid-cols-[7rem_1fr] items-start gap-3 border-b pb-3 last:border-b-0">
              <div className="pt-2">
                <div className="font-semibold">{DAY_LABELS[day]}</div>
                <label className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                  <Checkbox
                    checked={closed}
                    onCheckedChange={(checked) =>
                      setHours({ ...hours, [day]: checked ? [] : [{ open: "07:00", close: "17:00" }] })
                    }
                  />
                  Closed
                </label>
              </div>
              {closed ? (
                <p className="pt-2 text-gray-500">Closed all day</p>
              ) : (
                <IntervalEditor
                  id={`hours-${day}`}
                  intervals={hours[day]}
                  onChange={(next) => setHours({ ...hours, [day]: next })}
                  addLabel="Add a break"
                />
              )}
            </div>
          )
        })}
      </div>
    </FormDialog>
  )
}
