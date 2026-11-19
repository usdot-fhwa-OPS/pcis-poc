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

type DateTimePickerProps = {
  // The starting value (e.g. the current reservation time when modifying). Read once on mount.
  initialValue?: Date;
  onChange: (value: Date | undefined) => void;
};

// A button showing "Fri, 4/24/2026, 12:00 PM" that opens a calendar plus 30-minute time slots.
// Past dates and, on today's date, past times can't be picked.
// When used in a dialog, the dialog needs disablePointerDismissal: these menus render outside it.
export function DateTimePicker({ initialValue, onChange }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(initialValue ? startOfDay(initialValue) : undefined);
  const [timeSlot, setTimeSlot] = useState<number | undefined>(
    initialValue ? minutesIntoDay(initialValue) : undefined
  );

  const value = useMemo(
    () => (date && timeSlot !== undefined ? addMinutes(startOfDay(date), timeSlot) : undefined),
    [date, timeSlot]
  );

  const availableSlots = useMemo(() => {
    if (!date || !isSameDay(date, new Date())) return TIME_SLOTS;
    const minutesNow = minutesIntoDay(new Date());
    return TIME_SLOTS.filter((slot) => slot > minutesNow);
  }, [date]);

  function update(nextDate: Date | undefined, nextSlot: number | undefined) {
    setDate(nextDate);
    setTimeSlot(nextSlot);
    onChange(nextDate && nextSlot !== undefined ? addMinutes(startOfDay(nextDate), nextSlot) : undefined);
  }

  function handleDateSelect(selected: Date | undefined) {
    let slot = timeSlot;
    if (selected && slot !== undefined && isSameDay(selected, new Date()) && slot <= minutesIntoDay(new Date())) {
      slot = undefined;
    }
    update(selected, slot);
  }

  return (
    <Popover modal={true} open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-start font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatReservationTime(value) : <span className="text-muted-foreground">Select date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={{ before: startOfDay(new Date()) }}
          defaultMonth={date}
          initialFocus
        />
        <div className="flex items-center gap-2 border-t p-3">
          <Select
            value={timeSlot !== undefined ? String(timeSlot) : undefined}
            onValueChange={(slot) => update(date, Number(slot))}
            disabled={!date}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {availableSlots.map((slot) => (
                <SelectItem key={slot} value={String(slot)}>
                  {slotLabel(slot)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="ml-auto" disabled={!value} onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
