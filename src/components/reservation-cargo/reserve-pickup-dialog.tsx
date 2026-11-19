import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import {
  createReservationRequest,
  EquipmentTypeOption,
  listEquipmentTypesForCargoUnit,
} from "./reservation-manager-client";
import { ReservationConfirmationDetails } from "./reservation-confirmation-dialog";
import { formatDuration } from "./reservation-format";
import { DateTimePicker } from "./date-time-picker";

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
  // Called after a successful request; the parent shows the confirmation and refreshes the table.
  onRequested?: (details: ReservationConfirmationDetails) => void;
};

export function ReservePickupDialog({ cargoUnit, onRequested }: ReservePickupDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [requestedStart, setRequestedStart] = useState<Date | undefined>();
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

  const selectedEquipment = equipmentOptions.find((option) => option.equipmentType === equipmentType);
  const canSubmit = Boolean(requestedStart && selectedEquipment) && !isSubmitting;

  function reset() {
    setRequestedStart(undefined);
    setEquipmentType(undefined);
    setEquipmentError(undefined);
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) reset();
  }

  async function handleSubmit() {
    if (!requestedStart || !selectedEquipment) return;
    setIsSubmitting(true);
    try {
      const result = await createReservationRequest({
        preferredStartAt: requestedStart.toISOString(),
        moves: [{ cargoUnitID: cargoUnit.cargoUnitID, equipmentType: selectedEquipment.equipmentType }],
      });
      handleOpenChange(false);
      onRequested?.({
        confirmationCode: result.confirmationCode,
        cargoUnitID: cargoUnit.cargoUnitID,
        startAt: result.startAt,
        durationMins: result.durationMins,
        equipmentLabel: selectedEquipment.label,
      });
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
              <DateTimePicker onChange={setRequestedStart} />
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
