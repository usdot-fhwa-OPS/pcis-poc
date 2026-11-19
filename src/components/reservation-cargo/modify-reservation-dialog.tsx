import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DateTimePicker } from "./date-time-picker";
import {
  EquipmentTypeOption,
  listEquipmentTypesForTerminal,
  modifyReservation,
  ReservationForReview,
} from "./reservation-manager-client";
import { formatDuration, formatReservationTime } from "./reservation-format";
import { TwicQuestion } from "./twic-question";

type ModifyReservationDialogProps = {
  reservation: ReservationForReview | null;
  onClose: () => void;
  onDone: () => void | Promise<void>;
};

// I-4 Modify: the TO changes the time and/or equipment. Saving confirms the reservation automatically.
export function ModifyReservationDialog({ reservation, onClose, onDone }: ModifyReservationDialogProps) {
  return (
    <Dialog open={reservation !== null} onOpenChange={(open) => !open && onClose()} disablePointerDismissal>
      <DialogContent className="sm:max-w-[480px] text-left">
        {/* Keyed so the form starts fresh for each reservation. */}
        {reservation && (
          <ModifyForm key={reservation.reservationId} reservation={reservation} onClose={onClose} onDone={onDone} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ModifyForm({ reservation, onClose, onDone }: { reservation: ReservationForReview } & Omit<ModifyReservationDialogProps, "reservation">) {
  const originalStart = useMemo(() => new Date(reservation.startAt), [reservation.startAt]);
  const [startAt, setStartAt] = useState<Date | undefined>(originalStart);
  const [equipmentByMove, setEquipmentByMove] = useState<Record<string, string>>(() =>
    Object.fromEntries(reservation.moves.map((m) => [m.moveId, m.equipmentType]))
  );
  const [options, setOptions] = useState<EquipmentTypeOption[]>([]);
  const [optionsError, setOptionsError] = useState<string>();
  const [twicEscortRequired, setTwicEscortRequired] = useState<boolean | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listEquipmentTypesForTerminal(reservation.terminalId)
      .then((items) => !cancelled && setOptions(items))
      .catch((error: Error) => !cancelled && setOptionsError(error.message));
    return () => {
      cancelled = true;
    };
  }, [reservation.terminalId]);

  const labelFor = (type: string) =>
    options.find((o) => o.equipmentType === type)?.label ||
    reservation.moves.find((m) => m.equipmentType === type)?.equipmentLabel ||
    type;

  const newDuration = reservation.moves.reduce((sum, m) => {
    const option = options.find((o) => o.equipmentType === equipmentByMove[m.moveId]);
    return sum + (option ? option.defaultDurationMins : m.durationMins);
  }, 0);

  const timeChanged = Boolean(startAt) && startAt!.getTime() !== originalStart.getTime();
  const equipmentChanged = reservation.moves.some((m) => equipmentByMove[m.moveId] !== m.equipmentType);
  const changes: string[] = [];
  if (timeChanged) changes.push(`Time: ${formatReservationTime(originalStart)} → ${formatReservationTime(startAt!)}`);
  for (const m of reservation.moves) {
    if (equipmentByMove[m.moveId] !== m.equipmentType) {
      changes.push(`${reservation.moves.length > 1 ? `${m.cargoUnitID} ` : ""}Equipment: ${m.equipmentLabel} → ${labelFor(equipmentByMove[m.moveId])}`);
    }
  }
  if (equipmentChanged && newDuration !== reservation.durationMins) {
    changes.push(`Duration: ${formatDuration(reservation.durationMins)} → ${formatDuration(newDuration)}`);
  }

  const canSave = Boolean(startAt) && (timeChanged || equipmentChanged) && twicEscortRequired !== undefined && !isSubmitting;

  async function handleSave() {
    if (!startAt || twicEscortRequired === undefined) return;
    setIsSubmitting(true);
    try {
      await modifyReservation({
        reservationId: reservation.reservationId,
        startAt: startAt.toISOString(),
        moves: reservation.moves.map((m) => ({ moveId: m.moveId, equipmentType: equipmentByMove[m.moveId] })),
        twicEscortRequired,
      });
      toast.success(`Reservation ${reservation.confirmationCode} changed and confirmed`);
      await onDone();
    } catch (error) {
      toast.error((error as Error).message || "The reservation couldn't be changed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">Modify Reservation Request</DialogTitle>
        <DialogDescription className="text-xs leading-5">
          {`${reservation.confirmationCode} | Cargo Unit ID: ${reservation.moves.map((m) => m.cargoUnitID).join(", ")}`}
          <br />
          {`Requested: ${format(originalStart, "EEE, M/d/yyyy, h:mm a")} | ${reservation.moves.map((m) => m.equipmentLabel).join(", ")} (${formatDuration(reservation.durationMins)})`}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-5 py-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">New Time</span>
          <DateTimePicker initialValue={originalStart} onChange={setStartAt} />
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-medium">Equipment</span>
          {reservation.moves.map((m) => (
            <div key={m.moveId} className="flex items-center gap-3">
              {reservation.moves.length > 1 && <span className="w-28 text-xs text-muted-foreground">{m.cargoUnitID}</span>}
              <Select
                value={equipmentByMove[m.moveId]}
                onValueChange={(value) => setEquipmentByMove((prev) => ({ ...prev, [m.moveId]: value }))}
                disabled={options.length === 0}
              >
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder={optionsError ? "Equipment unavailable" : "Loading equipment…"}>
                    {labelFor(equipmentByMove[m.moveId])}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.equipmentType} value={o.equipmentType}>
                      {o.label} ({formatDuration(o.defaultDurationMins)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
          {optionsError && <p className="text-xs text-red-600">{optionsError}</p>}
        </div>

        <TwicQuestion idPrefix="modify" value={twicEscortRequired} onChange={setTwicEscortRequired} />

        <div className="rounded-lg border bg-muted/40 p-3 text-xs leading-5">
          {changes.length ? (
            <>
              <p className="font-semibold mb-1">Changes</p>
              <ul className="list-disc pl-4">
                {changes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <p className="mt-2 text-muted-foreground">
                Saving confirms the reservation with these changes. The Transportation Coordinator will see it was changed by the terminal.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Change the time or equipment. To confirm the request as it is, use Accept instead.</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave}>
          {isSubmitting ? "Saving…" : "Save and Confirm"}
        </Button>
      </DialogFooter>
    </>
  );
}
