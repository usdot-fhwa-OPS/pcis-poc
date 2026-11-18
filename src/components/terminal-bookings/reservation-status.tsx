import { useState } from "react";
import { Badge } from "../ui/badge.tsx";
import { Button } from "../ui/button.tsx";
import { Row, Table } from "@tanstack/react-table";
import { addHours, format, isAfter, isValid, parse } from "date-fns";
import { CalendarIcon, Clock, Pencil } from "lucide-react";
import { Calendar } from "../ui/calendar.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover.tsx";
import { TerminalOperatorDataTableMeta } from "./data-table.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../../lib/utils";

const OUTCOMES = ["Pending Pick Up", "Picked Up", "Late for Pick Up", "No Show", "Modified"] as const;
type ReservationOutcome = (typeof OUTCOMES)[number];

const RECORDED_OUTCOMES = new Set<string>(OUTCOMES);

// Shortcut to generate times from 12:00 AM to 11:00 PM
const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) =>
  format(new Date(2000, 0, 1, h), "hh:mm a"),
);

export function hasReservationWindowEnded(
  reservationDate?: string,
  reservationTime?: string,
  reservationStatus?: string,
): boolean {
  if (!reservationDate || !reservationTime) return false;
  if (reservationStatus && RECORDED_OUTCOMES.has(reservationStatus)) return false;

  const parts = reservationTime.split("-");
  const isRange = parts.length > 1;
  const timePart = parts[parts.length - 1].trim();

  const parsed = parse(
    `${reservationDate.trim()} ${timePart}`,
    "MM/dd/yyyy hh:mm a",
    new Date(),
  );
  if (!isValid(parsed)) return false;

  const windowEnd = isRange ? parsed : addHours(parsed, 1);
  return isAfter(new Date(), windowEnd);
}


const STATUS_COLORS: Record<string, string> = {
  "Late for Pick Up": "bg-red-100 hover:bg-red-100/80 text-red-700",
  "No Show": "bg-red-100 hover:bg-red-100/80 text-red-700",
  "Picked Up": "bg-green-50 hover:bg-green-50/80 text-green-600",
  "Pending Pick Up": "bg-blue-50 hover:bg-blue-50/80 text-blue-700"
};

const DEFAULT_STATUS_COLOR = "bg-gray-50 hover:bg-gray-50/80 text-gray-700";

export function ReservationStatusBadge({
  reservationDate,
  reservationTime,
  reservationStatus,
}: {
  reservationDate?: string;
  reservationTime?: string;
  reservationStatus?: string;
}) {
  const needsOutcome = hasReservationWindowEnded(
    reservationDate,
    reservationTime,
    reservationStatus,
  );

  return (
    <div className="min-w-[150px] text-center">
      {needsOutcome ? (
        <Badge className="gap-1 rounded-full border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100/80">
          <Clock className="inline-block h-4 w-4 text-amber-700" />
          Needs Outcome
        </Badge>
      ) : (
        <Badge
          className={cn(
            "whitespace-normal break-words rounded-full border-transparent",
            STATUS_COLORS[reservationStatus ?? ""] ?? DEFAULT_STATUS_COLOR, 
          )}
        >
          {reservationStatus}
        </Badge>
      )}
    </div>
  );
}

export function RecordOutcomeCell({
  row,
  table,
}: {
  row: Row<any>;
  table: Table<any>;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [outcome, setOutcome] = useState<ReservationOutcome | undefined>();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const isModified = outcome === "Modified";
  const canSubmit = !!outcome && (!isModified || (!!date && !!time));

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setOutcome(undefined);
      setDate(new Date());
      setTime(undefined);
      setIsCalendarOpen(false);
    }
  };

  const handleRecord = async () => {
    if (!outcome || (isModified && (!date || !time))) return;
    const id = row.original.cargoUnitID;
    const meta = table.options.meta as TerminalOperatorDataTableMeta | undefined;
  
    if (isModified) {
      await meta?.updateBooking(
          id,
          "Pending Pick Up",
          format(date!, "MM/dd/yyyy"),
          time,
        );
    } else if (outcome === "Late for Pick Up" && meta?.markBookingLate) {
      await meta.markBookingLate(id, outcome);
    } else {
      await meta?.updateBooking(id, outcome);
    }
    handleOpenChange(false);
  };

  const helpText = !outcome
    ? "Please select an appropriate outcome for this reservation"
    : !isModified
      ? `Selected: ${outcome}`
      : date && time
        ? `Selected: ${format(date, "MM/dd/yyyy")} ${time}`
        : "Please select both date and time";
  
  return (
    <div className="text-center">
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger>
          <Button
            variant="ghost"
            className="p-2"
          >
            <Pencil />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Reservation Outcome</DialogTitle>
            <div className="text-sm">
              Original Reservation: {row.original.reservationDate} at{" "}
              {row.original.reservationTime}
            </div>
            <div className="text-sm text-muted-foreground">
              Vessel ID: {row.original.vesselID} | Cargo Unit ID:{" "}
              {row.original.cargoUnitID} | Origin: {row.original.origin} | BCO:{" "}
              {row.original.bcoName} | BCO Email: {row.original.bcoEmail}
            </div>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-sm font-medium">Outcome</span>
              <Select
                value={outcome}
                onValueChange={(val) => setOutcome(val as ReservationOutcome)}
              >
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isModified && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <CalendarIcon className="h-4 w-4" />
                  <Popover
                    modal={true}
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[280px] justify-start text-left font-normal",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? (
                          format(date, "MM/dd/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        disabled={{ before: new Date() }}
                        onSelect={(selectedDate) => {
                          if (!selectedDate) return;
                          setDate(selectedDate);
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Clock className="h-4 w-4" />
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((timeOption) => (
                        <SelectItem key={timeOption} value={timeOption}>
                          {timeOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">{helpText}</div>
            <Button
              disabled={!canSubmit}
              variant={!canSubmit ? "outline" : "default"}
              onClick={handleRecord}
            >
              Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
