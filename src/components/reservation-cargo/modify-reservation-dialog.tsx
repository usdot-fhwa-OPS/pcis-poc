import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DateTimePicker } from "./date-time-picker";
import { GangSelect } from "./gang-select";
import {
  EquipmentTypeOption,
  GangOption,
  listEquipmentTypesForTerminal,
  modifyReservation,
  ReservationForReview,
} from "./reservation-manager-client";
import { formatDuration, formatReservationTime } from "./reservation-format";
import { TwicQuestion } from "./twic-question";

const MAX_DURATION_MINS = 1440;

type ModifyReservationDialogProps = {
  reservation: ReservationForReview | null;
  // Active gangs at the reservation's terminal.
  gangs: GangOption[];
  onClose: () => void;
  onDone: () => void | Promise<void>;
};

// I-4 Modify: the TO changes the time, equipment and/or duration, assigns a gang and accepts in one step.
export function ModifyReservationDialog({ reservation, gangs, onClose, onDone }: ModifyReservationDialogProps) {
  return (
    <Dialog open={reservation !== null} onOpenChange={(open) => !open && onClose()} disablePointerDismissal>
      <DialogContent className="sm:max-w-[520px] text-left max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
        {/* Keyed so the form starts fresh for each reservation. */}
        {reservation && (
          <ModifyForm key={reservation.reservationId} reservation={reservation} gangs={gangs} onClose={onClose} onDone={onDone} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function isValidDuration(value: string) {
  const mins = Number(value);
  return value.trim() !== "" && Number.isInteger(mins) && mins >= 1 && mins <= MAX_DURATION_MINS;
}

function ModifyForm({
  reservation,
  gangs,
  onClose,
  onDone,
}: { reservation: ReservationForReview } & Omit<ModifyReservationDialogProps, "reservation">) {
  const originalStart = useMemo(() => new Date(reservation.startAt), [reservation.startAt]);
  const [startAt, setStartAt] = useState<Date | undefined>(originalStart);
  const [equipmentByMove, setEquipmentByMove] = useState<Record<string, string>>(() =>
    Object.fromEntries(reservation.moves.map((m) => [m.moveId, m.equipmentType]))
  );
  // Kept as text so the TO can clear and retype the field.
  const [durationByMove, setDurationByMove] = useState<Record<string, string>>(() =>
    Object.fromEntries(reservation.moves.map((m) => [m.moveId, String(m.durationMins)]))
  );
  const [gangByMove, setGangByMove] = useState<Record<string, string>>({});
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

  const optionFor = (type: string) => options.find((o) => o.equipmentType === type);
  const labelFor = (type: string) =>
    optionFor(type)?.label || reservation.moves.find((m) => m.equipmentType === type)?.equipmentLabel || type;

  function changeEquipment(moveId: string, equipmentType: string) {
    setEquipmentByMove((prev) => ({ ...prev, [moveId]: equipmentType }));
    // A new equipment type starts from its own default duration.
    const option = optionFor(equipmentType);
    if (option) setDurationByMove((prev) => ({ ...prev, [moveId]: String(option.defaultDurationMins) }));
  }

  const durationsValid = reservation.moves.every((m) => isValidDuration(durationByMove[m.moveId]));
  const newTotal = durationsValid ? reservation.moves.reduce((sum, m) => sum + Number(durationByMove[m.moveId]), 0) : undefined;

  const timeChanged = Boolean(startAt) && startAt!.getTime() !== originalStart.getTime();
  const changes: string[] = [];
  if (timeChanged) changes.push(`Time: ${formatReservationTime(originalStart)} → ${formatReservationTime(startAt!)}`);
  for (const m of reservation.moves) {
    const prefix = reservation.moves.length > 1 ? `${m.cargoUnitID} ` : "";
    if (equipmentByMove[m.moveId] !== m.equipmentType) {
      changes.push(`${prefix}Equipment: ${m.equipmentLabel} → ${labelFor(equipmentByMove[m.moveId])}`);
    }
    if (isValidDuration(durationByMove[m.moveId]) && Number(durationByMove[m.moveId]) !== m.durationMins) {
      changes.push(`${prefix}Duration: ${formatDuration(m.durationMins)} → ${formatDuration(Number(durationByMove[m.moveId]))}`);
    }
  }
  if (reservation.moves.length > 1 && newTotal !== undefined && newTotal !== reservation.durationMins) {
    changes.push(`Total duration: ${formatDuration(reservation.durationMins)} → ${formatDuration(newTotal)}`);
  }

  const allGangsAssigned = reservation.moves.every((m) => gangByMove[m.moveId]);
  const canSave =
    Boolean(startAt) && changes.length > 0 && durationsValid && allGangsAssigned && twicEscortRequired !== undefined && !isSubmitting;

  async function handleSave() {
    if (!startAt || twicEscortRequired === undefined || !durationsValid) return;
    setIsSubmitting(true);
    try {
      await modifyReservation({
        reservationId: reservation.reservationId,
        startAt: startAt.toISOString(),
        moves: reservation.moves.map((m) => ({
          moveId: m.moveId,
          equipmentType: equipmentByMove[m.moveId],
          durationMins: Number(durationByMove[m.moveId]),
        })),
        twicEscortRequired,
        gangAssignments: reservation.moves.map((m) => ({ moveId: m.moveId, gangId: gangByMove[m.moveId] })),
      });
      toast.success(`Reservation ${reservation.confirmationCode} changed and accepted`);
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

      <div className="grid gap-5 py-2 min-h-0 overflow-y-auto">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">New Time</span>
          <DateTimePicker initialValue={originalStart} onChange={setStartAt} />
        </div>

        {reservation.moves.map((m) => {
          const equipmentType = equipmentByMove[m.moveId];
          const defaultMins = optionFor(equipmentType)?.defaultDurationMins;
          const durationText = durationByMove[m.moveId];
          return (
            <div key={m.moveId} className="grid gap-3 rounded-lg border p-3">
              {reservation.moves.length > 1 && <p className="text-xs font-semibold">{m.cargoUnitID}</p>}
              <div className="grid grid-cols-[110px_1fr] items-center gap-x-3 gap-y-3">
                <span className="text-sm font-medium">Equipment</span>
                <Select value={equipmentType} onValueChange={(value) => changeEquipment(m.moveId, value)} disabled={options.length === 0}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder={optionsError ? "Equipment unavailable" : "Loading equipment…"}>
                      {labelFor(equipmentType)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((o) => (
                      <SelectItem key={o.equipmentType} value={o.equipmentType}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-sm font-medium">Duration</span>
                <div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_DURATION_MINS}
                      step={5}
                      value={durationText}
                      onChange={(e) => setDurationByMove((prev) => ({ ...prev, [m.moveId]: e.target.value }))}
                      className="w-24"
                      aria-label={`Duration in minutes for ${m.cargoUnitID}`}
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                  <p className={`mt-1 text-xs ${isValidDuration(durationText) ? "text-muted-foreground" : "text-red-600"}`}>
                    {isValidDuration(durationText)
                      ? defaultMins !== undefined
                        ? `Default for ${labelFor(equipmentType)}: ${formatDuration(defaultMins)}`
                        : ""
                      : `Enter whole minutes from 1 to ${MAX_DURATION_MINS}.`}
                  </p>
                </div>

                <span className="text-sm font-medium">
                  Gang <span className="text-red-600">*</span>
                </span>
                <GangSelect
                  gangs={gangs}
                  equipmentType={equipmentType}
                  equipmentLabel={labelFor(equipmentType)}
                  value={gangByMove[m.moveId]}
                  onChange={(gangId) => setGangByMove((prev) => ({ ...prev, [m.moveId]: gangId }))}
                />
              </div>
            </div>
          );
        })}
        {optionsError && <p className="text-xs text-red-600">{optionsError}</p>}

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
                Saving accepts the reservation with these changes. The Transportation Coordinator will see it was changed by the terminal.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Change the time, equipment or duration. To accept the request as it is, use Accept instead.</p>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave}>
          {isSubmitting ? "Saving…" : "Save and Accept"}
        </Button>
      </DialogFooter>
    </>
  );
}
