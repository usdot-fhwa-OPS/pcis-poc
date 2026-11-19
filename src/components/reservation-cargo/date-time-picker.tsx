import { useMemo, useState } from "react";
import { addMinutes, format, isSameDay, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { formatReservationTime } from "./reservation-format";

const TIME_STEP_MINS = 30;

// "12:00 AM" … "11:30 PM" as minutes after midnight.
const TIME_SLOTS = Array.from({ length: (24 * 60) / TIME_STEP_MINS }, (_, i) => i * TIME_STEP_MINS);

function slotLabel(minutes: number) {
  return format(addMinutes(startOfDay(new Date()), minutes), "h:mm a");
}

function minutesIntoDay(value: Date) {
  return value.getHours() * 60 + value.getMinutes();
}

type Selection = { date?: Date; slot?: number };

function toDate({ date, slot }: Selection) {
  return date && slot !== undefined ? addMinutes(startOfDay(date), slot) : undefined;
}

type DateTimePickerProps = {
  // The starting value (e.g. the current reservation time when modifying). Read once on mount.
  initialValue?: Date;
  onChange: (value: Date | undefined) => void;
};

// A button showing "Fri, 4/24/2026, 12:00 PM" that opens a calendar plus 30-minute time slots.
// Edits in the popover are a draft: only Done applies them. Cancel, Escape or clicking away leaves
// the previous value untouched, so just looking at the calendar never changes the form.
// Past dates and, on today's date, past times can't be picked.
// When used in a dialog, the dialog needs disablePointerDismissal: these menus render outside it.
export function DateTimePicker({ initialValue, onChange }: DateTimePickerProps) {
  const initial: Selection = initialValue
    ? { date: startOfDay(initialValue), slot: minutesIntoDay(initialValue) }
    : {};
  const [isOpen, setIsOpen] = useState(false);
  const [applied, setApplied] = useState<Selection>(initial);
  const [draft, setDraft] = useState<Selection>(initial);

  const appliedValue = toDate(applied);
  const draftValue = toDate(draft);

  const availableSlots = useMemo(() => {
    if (!draft.date || !isSameDay(draft.date, new Date())) return TIME_SLOTS;
    const minutesNow = minutesIntoDay(new Date());
    return TIME_SLOTS.filter((slot) => slot > minutesNow);
  }, [draft.date]);

  function handleOpenChange(open: boolean) {
    // Every time the popover opens, the draft starts from the applied value; closing without Done discards it.
    if (open) setDraft(applied);
    setIsOpen(open);
  }

  function handleDateSelect(selected: Date | undefined) {
    if (!selected) return; // clicking the selected day again keeps it selected
    setDraft((prev) => {
      const slotPassed =
        prev.slot !== undefined && isSameDay(selected, new Date()) && prev.slot <= minutesIntoDay(new Date());
      return { date: selected, slot: slotPassed ? undefined : prev.slot };
    });
  }

  function apply() {
    setApplied(draft);
    onChange(draftValue);
    setIsOpen(false);
  }

  return (
    <Popover modal={true} open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {appliedValue ? formatReservationTime(appliedValue) : <span className="text-muted-foreground">Select date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {/* The popover is as wide as the calendar; the time and buttons sit underneath on their own rows. */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            required
            selected={draft.date}
            onSelect={handleDateSelect}
            disabled={{ before: startOfDay(new Date()) }}
            defaultMonth={draft.date}
            initialFocus
          />
        </div>
        <div className="grid gap-2 border-t p-3">
          <Select
            value={draft.slot !== undefined ? String(draft.slot) : undefined}
            onValueChange={(slot) => setDraft((prev) => ({ ...prev, slot: Number(slot) }))}
            disabled={!draft.date}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={draft.date ? "Select time" : "Pick a date first"} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {availableSlots.map((slot) => (
                <SelectItem key={slot} value={String(slot)}>
                  {slotLabel(slot)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" disabled={!draftValue} onClick={apply}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
