import { DAYS, DAY_LABELS, DAY_SHORT, MONTHS, WEEK_NUMBERS, describeRecurrence } from "../terminal-resource/capacity-format"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { RadioGroup, RadioGroupItem } from "../ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Field } from "./form-dialog"
import { parseDays, Recurrence } from "./capacity-rules"

type Frequency = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
const UNIT: Record<string, string> = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" }

// A day or month toggle button, like a chip.
function Toggle({ on, label, title, onClick }: { on: boolean, label: string, title?: string, onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      title={title}
      onClick={onClick}
      className={`h-8 min-w-11 rounded-md border px-2 text-sm ${on ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
    >
      {label}
    </button>
  )
}

export function RecurrenceEditor({ value, onChange, daysText, setDaysText, startDate }: {
  value: Recurrence | undefined
  onChange: (next: Recurrence | undefined) => void
  daysText: string                     // the "days of month" box, kept as text while typing
  setDaysText: (text: string) => void
  startDate: string                    // "YYYY-MM-DD" of the first outage, for defaults
}) {
  const frequency: Frequency = (value?.frequency as Frequency) ?? "NONE"
  const set = (patch: Partial<Recurrence>) => value && onChange({ ...value, ...patch })

  function changeFrequency(next: Frequency) {
    if (next === "NONE") return onChange(undefined)
    const base: Recurrence = { frequency: next, interval: value?.interval ?? 1, until: value?.until }
    const startDow = startDate ? DAYS[(new Date(`${startDate}T12:00:00`).getDay() + 6) % 7] : "MON"
    if (next === "WEEKLY") base.daysOfWeek = [startDow]
    if (next === "MONTHLY") { base.cycle = "EACH"; base.daysOfMonth = startDate ? [Number(startDate.slice(8, 10))] : [1] }
    if (next === "YEARLY") base.months = startDate ? [Number(startDate.slice(5, 7))] : [1]
    setDaysText(base.daysOfMonth ? base.daysOfMonth.join(", ") : "")
    onChange(base)
  }

  function setCycle(cycle: "SAME" | "EACH" | "ON_THE") {
    if (!value) return
    const rest: Recurrence = { ...value }
    delete rest.cycle; delete rest.daysOfMonth; delete rest.weekNumber; delete rest.dayOfWeek
    if (cycle === "SAME") return onChange(rest)
    if (cycle === "EACH") return onChange({ ...rest, cycle, daysOfMonth: parseDays(daysText) ?? [] })
    onChange({ ...rest, cycle, weekNumber: "FIRST", dayOfWeek: "MON" })
  }

  const toggleIn = <T,>(list: T[] | undefined, item: T) =>
    list?.includes(item) ? list.filter((x) => x !== item) : [...(list ?? []), item]

  return (
    <div className="grid gap-4 rounded-lg border bg-gray-50/60 p-3">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Repeat">
          <Select value={frequency} onValueChange={(v) => changeFrequency(v as Frequency)}>
            <SelectTrigger aria-label="Repeat"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Doesn't repeat</SelectItem>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        {value && (
          <Field label="Every" htmlFor="repeat-every">
            <div className="flex items-center gap-2">
              <Input
                id="repeat-every" type="number" min={1} max={99} step={1} className="w-20"
                value={Number.isNaN(value.interval) ? "" : value.interval}
                onChange={(e) => set({ interval: e.target.value === "" ? NaN : Number(e.target.value) })}
              />
              <span className="text-gray-600">{UNIT[value.frequency]}{value.interval === 1 ? "" : "s"}</span>
            </div>
          </Field>
        )}
      </div>

      {value?.frequency === "WEEKLY" && (
        <Field label="On">
          <div className="flex flex-wrap gap-1">
            {DAYS.map((d) => (
              <Toggle key={d} label={DAY_SHORT[d]} title={DAY_LABELS[d]} on={Boolean(value.daysOfWeek?.includes(d))}
                onClick={() => set({ daysOfWeek: DAYS.filter((x) => toggleIn(value.daysOfWeek, d).includes(x)) })} />
            ))}
          </div>
        </Field>
      )}

      {value?.frequency === "YEARLY" && (
        <Field label="In">
          <div className="flex flex-wrap gap-1">
            {MONTHS.map((m, i) => (
              <Toggle key={m} label={m} on={Boolean(value.months?.includes(i + 1))}
                onClick={() => set({ months: toggleIn(value.months, i + 1).sort((a, b) => a - b) })} />
            ))}
          </div>
        </Field>
      )}

      {(value?.frequency === "MONTHLY" || value?.frequency === "YEARLY") && (
        <RadioGroup
          value={value.cycle ?? "SAME"}
          onValueChange={(v) => setCycle(v as "SAME" | "EACH" | "ON_THE")}
          className="grid gap-3"
        >
          {value.frequency === "YEARLY" && (
            <div className="flex items-center gap-2">
              <RadioGroupItem value="SAME" id="cycle-same" />
              <Label htmlFor="cycle-same">On the same day of the month as the first outage</Label>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <RadioGroupItem value="EACH" id="cycle-each" />
            <Label htmlFor="cycle-each">On day(s)</Label>
            <Input
              aria-label="Days of the month"
              className="w-40"
              placeholder="1, 15"
              value={daysText}
              disabled={value.cycle !== "EACH"}
              onChange={(e) => { setDaysText(e.target.value); set({ daysOfMonth: parseDays(e.target.value) ?? [] }) }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <RadioGroupItem value="ON_THE" id="cycle-on-the" />
            <Label htmlFor="cycle-on-the">On the</Label>
            <Select value={value.weekNumber ?? "FIRST"} onValueChange={(v) => set({ weekNumber: v })} disabled={value.cycle !== "ON_THE"}>
              <SelectTrigger className="w-28" aria-label="Which week"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEEK_NUMBERS.map((w) => <SelectItem key={w} value={w}>{w[0] + w.slice(1).toLowerCase()}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={value.dayOfWeek ?? "MON"} onValueChange={(v) => set({ dayOfWeek: v })} disabled={value.cycle !== "ON_THE"}>
              <SelectTrigger className="w-36" aria-label="Day of the week"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => <SelectItem key={d} value={d}>{DAY_LABELS[d]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </RadioGroup>
      )}

      {value && (
        <Field label="Ends" htmlFor="repeat-until" hint="Leave blank to repeat with no end date.">
          <Input id="repeat-until" type="date" className="w-48" value={value.until ?? ""} min={startDate || undefined}
            onChange={(e) => set({ until: e.target.value || undefined })} />
        </Field>
      )}

      <p className="text-sm text-gray-700"><span className="font-semibold">Summary:</span> {describeRecurrence(value)}</p>
    </div>
  )
}
