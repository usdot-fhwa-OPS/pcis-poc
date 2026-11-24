import { Plus, X } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import type { OpenInterval } from "../terminal-resource/terminal-resource-manager-client"

// Edits a list of open periods for one day, e.g. 07:00–12:00 and 13:00–17:00. Empty = closed.
export function IntervalEditor({ id, intervals, onChange, addLabel = "Add hours" }: {
  id: string
  intervals: OpenInterval[]
  onChange: (next: OpenInterval[]) => void
  addLabel?: string
}) {
  const update = (i: number, patch: Partial<OpenInterval>) =>
    onChange(intervals.map((iv, j) => (j === i ? { ...iv, ...patch } : iv)))
  const remove = (i: number) => onChange(intervals.filter((_, j) => j !== i))
  const add = () => {
    const last = intervals[intervals.length - 1]
    onChange([...intervals, last ? { open: last.close, close: last.close < "23:00" ? "23:00" : "23:59" } : { open: "07:00", close: "17:00" }])
  }

  return (
    <div className="grid gap-2">
      {intervals.map((iv, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            id={i === 0 ? id : undefined}
            type="time"
            aria-label="Opens"
            value={iv.open}
            onChange={(e) => update(i, { open: e.target.value })}
            className="w-32"
            required
          />
          <span className="text-gray-500">to</span>
          <Input
            type="time"
            aria-label="Closes"
            value={iv.close}
            onChange={(e) => update(i, { close: e.target.value })}
            className="w-32"
            required
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove these hours">
            <X />
          </Button>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus /> {addLabel}
        </Button>
      </div>
    </div>
  )
}

