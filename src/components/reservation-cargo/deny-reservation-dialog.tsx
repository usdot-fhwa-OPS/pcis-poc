import { useState } from "react";
import { toast } from "sonner";
import { CircleX } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { denyReservation, ReservationForReview } from "./reservation-manager-client";
import { formatReservationTime } from "./reservation-format";

const MAX_REASON_LENGTH = 500;

type DenyReservationDialogProps = {
  reservation: ReservationForReview | null;
  onClose: () => void;
  onDone: () => void | Promise<void>;
};

// I-4 Deny: requires a reason. The cargo goes back to the TC, who can request another time.
export function DenyReservationDialog({ reservation, onClose, onDone }: DenyReservationDialogProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmed = reason.trim();

  function close() {
    setReason("");
    onClose();
  }

  async function handleDeny() {
    if (!reservation || !trimmed) return;
    setIsSubmitting(true);
    try {
      await denyReservation(reservation.reservationId, trimmed);
      toast.success(`Reservation ${reservation.confirmationCode} denied`);
      setReason("");
      await onDone();
    } catch (error) {
      toast.error((error as Error).message || "The request couldn't be denied. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={reservation !== null} onOpenChange={(open) => !open && close()} disablePointerDismissal>
      <DialogContent className="sm:max-w-md gap-6 p-0 text-left max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader className="flex flex-row items-center gap-0 min-h-[53px] p-4 border-b">
          <DialogTitle className="text-lg">Deny Reservation Request</DialogTitle>
        </DialogHeader>
        {reservation && (
          <div className="px-4 grid gap-4 min-h-0 overflow-y-auto">
            <div className="flex items-start gap-4">
              <span className="inline-flex shrink-0 rounded-full p-3 bg-red-100">
                <CircleX className="size-6 stroke-red-600" />
              </span>
              <div>
                <p className="text-base font-semibold mb-2">
                  Deny reservation {reservation.confirmationCode} for cargo unit{" "}
                  {reservation.moves.map((m) => m.cargoUnitID).join(", ")}?
                </p>
                <p className="text-gray-600">
                  Requested for {formatReservationTime(reservation.startAt)}. The cargo goes back to the Transportation
                  Coordinator, who can request another time.
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deny-reason" className="text-sm font-semibold">
                Reason <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="deny-reason"
                value={reason}
                maxLength={MAX_REASON_LENGTH}
                onChange={(e) => setReason(e.target.value)}
                placeholder="For example: crane out of service that day, please pick another time."
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {reason.length}/{MAX_REASON_LENGTH}
              </p>
            </div>
          </div>
        )}
        <DialogFooter className="mx-0 mb-0">
          <Button variant="outline" onClick={close} disabled={isSubmitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleDeny} disabled={!trimmed || isSubmitting}>
            {isSubmitting ? "Denying…" : "Deny Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
