import { useEffect, useMemo, useState } from "react";
import { addMinutes, format, isSameDay, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import {
  createReservationRequest,
  EquipmentTypeOption,
  listEquipmentTypesForCargoUnit,
} from "./reservation-manager-client";

export type ReservePickupCargoUnit = {
  cargoUnitID: string;
  vesselID?: string | null;
  origin?: string | null;
  bcoName?: string | null;
  bcoEmail?: string | null;
  containerStatus?: string | null;
};

type ReservePickupDialogProps = {
  cargoUnit: ReservePickupCargoUnit;
  onReserved?: () => void | Promise<void>;
};

const TIME_STEP_MINS = 30;

// "12:00 AM" … "11:30 PM" as minutes after midnight.
const TIME_SLOTS = Array.from({ length: (24 * 60) / TIME_STEP_MINS }, (_, i) => i * TIME_STEP_MINS);

function slotLabel(minutes: number) {
  return format(addMinutes(startOfDay(new Date()), minutes), "h:mm a");
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} Minutes`;
  const hours = Number((minutes / 60).toFixed(2));
  return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
}

export function ReservePickupDialog({ cargoUnit, onReserved }: ReservePickupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [timeSlot, setTimeSlot] = useState<number | undefined>();
  const [equipmentOptions, setEquipmentOptions] = useState<EquipmentTypeOption[]>([]);
  const [equipmentType, setEquipmentType] = useState<string | undefined>();
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);
  const [equipmentError, setEquipmentError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOnShip = cargoUnit.containerStatus === "On-Ship";

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsLoadingEquipment(true);
    setEquipmentError(undefined);
    listEquipmentTypesForCargoUnit(cargoUnit.cargoUnitID)
      .then((items) => {
        if (!cancelled) setEquipmentOptions(items);
      })
      .catch((error: Error) => {
        if (!cancelled) setEquipmentError(error.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingEquipment(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, cargoUnit.cargoUnitID]);

  const requestedStart = useMemo(
    () => (date && timeSlot !== undefined ? addMinutes(startOfDay(date), timeSlot) : undefined),
    [date, timeSlot]
  );

  // On today's date, only times from now on can be picked.
  const availableSlots = useMemo(() => {
    if (!date || !isSameDay(date, new Date())) return TIME_SLOTS;
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    return TIME_SLOTS.filter((slot) => slot > minutesNow);
  }, [date]);

  const selectedEquipment = equipmentOptions.find((option) => option.equipmentType === equipmentType);
  const canSubmit = Boolean(requestedStart && selectedEquipment) && !isSubmitting;

  function reset() {
    setDate(undefined);
    setTimeSlot(undefined);
    setEquipmentType(undefined);
    setEquipmentError(undefined);
    setIsPickerOpen(false);
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) reset();
  }

  function handleDateSelect(selected: Date | undefined) {
    setDate(selected);
    if (selected && timeSlot !== undefined && isSameDay(selected, new Date())) {
      const now = new Date();
      if (timeSlot <= now.getHours() * 60 + now.getMinutes()) setTimeSlot(undefined);
    }
  }

  async function handleSubmit() {
    if (!requestedStart || !selectedEquipment) return;
    setIsSubmitting(true);
    try {
      const result = await createReservationRequest({
        preferredStartAt: requestedStart.toISOString(),
        moves: [{ cargoUnitID: cargoUnit.cargoUnitID, equipmentType: selectedEquipment.equipmentType }],
      });
      toast.success(`Pickup requested. Confirmation code: ${result.confirmationCode}`);
      handleOpenChange(false);
      await onReserved?.();
    } catch (error) {
      toast.error((error as Error).message || "The reservation couldn't be requested. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <span>
              <Button variant="outline" onClick={() => setIsOpen(true)} disabled={isOnShip}>
                Reserve
              </Button>
            </span>
          </TooltipTrigger>
          {isOnShip && (
            <TooltipContent>
              <p>Cargo Unit still on ship. Cannot reserve.</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      {/* The date/time and equipment pickers render their menus outside the dialog. Without
          disablePointerDismissal, choosing an option counts as an "outside" click and closes the
          dialog. Cancel, the X button and Escape still close it. */}
      <Dialog open={isOpen} onOpenChange={handleOpenChange} disablePointerDismissal>
        <DialogContent className="sm:max-w-[440px] text-left">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Reserve Cargo Unit Pickup</DialogTitle>
            <DialogDescription className="text-xs leading-5">
              {`Vessel ID: ${cargoUnit.vesselID ?? "—"} | Cargo Unit ID: ${cargoUnit.cargoUnitID} | Origin: ${cargoUnit.origin ?? "—"}`}
              <br />
              {`BCO: ${cargoUnit.bcoName ?? "—"} | BCO Email: ${cargoUnit.bcoEmail ?? "—"}`}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Requested Time</span>
              <Popover modal={true} open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {requestedStart ? (
                      format(requestedStart, "EEE, M/d/yyyy, h:mm a")
                    ) : (
                      <span className="text-muted-foreground">Select date and time</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                    disabled={{ before: startOfDay(new Date()) }}
                    initialFocus
                  />
                  <div className="flex items-center gap-2 border-t p-3">
                    <Select
                      value={timeSlot !== undefined ? String(timeSlot) : undefined}
                      onValueChange={(value) => setTimeSlot(Number(value))}
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
                    <Button
                      size="sm"
                      className="ml-auto"
                      disabled={!requestedStart}
                      onClick={() => setIsPickerOpen(false)}
                    >
                      Done
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <span className="text-sm font-medium">Equipment Needed</span>
              <Select
                value={equipmentType}
                onValueChange={setEquipmentType}
                disabled={isLoadingEquipment || Boolean(equipmentError) || equipmentOptions.length === 0}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue
                    placeholder={
                      isLoadingEquipment
                        ? "Loading equipment…"
                        : equipmentOptions.length === 0 && !equipmentError
                          ? "No equipment available"
                          : "Select equipment"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {equipmentOptions.map((option) => (
                    <SelectItem key={option.equipmentType} value={option.equipmentType}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {equipmentError && <p className="text-xs text-red-600">{equipmentError}</p>}
            </div>

            {selectedEquipment && (
              <p className="text-xs text-muted-foreground">
                Estimated Pickup Duration: {formatDuration(selectedEquipment.defaultDurationMins)}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isSubmitting ? "Reserving…" : "Reserve Pickup"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
