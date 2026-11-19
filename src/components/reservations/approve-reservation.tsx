import { useState } from "react";
import { toast } from "sonner";
import { ChevronDownIcon, CircleCheckBig } from "lucide-react";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { acceptReservation, ReservationForReview } from "../reservation-cargo/reservation-manager-client";
import { formatDuration, formatReservationTime } from "../reservation-cargo/reservation-format";
import { TwicQuestion } from "../reservation-cargo/twic-question";

type AcceptReservationDialogProps = {
  reservation: ReservationForReview | null;
  onClose: () => void;
  onDone: () => void | Promise<void>;
};

// I-4 Accept: the TO confirms a requested reservation as it is, answering the TWIC escort question.
export function AcceptReservationDialog({ reservation, onClose, onDone }: AcceptReservationDialogProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [twicEscortRequired, setTwicEscortRequired] = useState<boolean | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function close() {
    setShowDetails(false);
    setTwicEscortRequired(undefined);
    onClose();
  }

  async function handleAccept() {
    if (!reservation || twicEscortRequired === undefined) return;
    setIsSubmitting(true);
    try {
      await acceptReservation(reservation.reservationId, twicEscortRequired);
      toast.success(`Reservation ${reservation.confirmationCode} confirmed`);
      setShowDetails(false);
      setTwicEscortRequired(undefined);
      await onDone();
    } catch (error) {
      toast.error((error as Error).message || "The reservation couldn't be confirmed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const move = reservation?.moves[0];
  const cargoUnits = reservation?.moves.map((m) => m.cargoUnitID).join(", ");

  return (
    <Dialog open={reservation !== null} onOpenChange={(open) => !open && close()} disablePointerDismissal>
      <DialogContent className="sm:max-w-md gap-6 p-0 text-left">
        <DialogHeader className="flex flex-row items-center gap-0 min-h-[53px] p-4 border-b">
          <DialogTitle className="text-lg">Accept Reservation</DialogTitle>
        </DialogHeader>
        {reservation && (
          <div className="px-4">
            <div className="flex items-start gap-4 mb-6">
              <span className="inline-flex shrink-0 rounded-full p-3 bg-green-100">
                <CircleCheckBig className="size-6 stroke-green-600" />
              </span>
              <div>
                <p className="text-base font-semibold mb-2">
                  Accept reservation {reservation.confirmationCode} for cargo unit {cargoUnits}?
                </p>
                <p className="text-gray-600">
                  It will be confirmed for {formatReservationTime(reservation.startAt)} and move to the Ongoing tab.
                  The Transportation Coordinator will be notified.
                </p>
              </div>
            </div>
            <Collapsible open={showDetails} onOpenChange={setShowDetails} className="mb-6 pb-4 border-b">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="group w-fit">
                  {showDetails ? "Hide Details" : "Show Details"}
                  <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-y-2 sm:gap-x-8 sm:gap-y-4 items-start pb-3 sm:pb-0">
                  <div className="font-semibold">Vessel ID:</div>
                  <div>{move?.vesselID ?? "—"}</div>
                  <div className="font-semibold">Origin:</div>
                  <div>{move?.origin ?? "—"}</div>
                  <div className="font-semibold">BCO:</div>
                  <div>
                    <p>{move?.bcoName ?? "—"}</p>
                    {move?.bcoEmail && (
                      <p className="break-all"><a href={`mailto:${move.bcoEmail}`} className="text-blue-500 hover:underline">{move.bcoEmail}</a></p>
                    )}
                  </div>
                  <div className="font-semibold">Transportation Coordinator:</div>
                  <div>
                    <p>{move?.transopName || reservation.requestingUserName || "—"}</p>
                    <p className="break-all"><a href={`mailto:${reservation.requestingUserEmail}`} className="text-blue-500 hover:underline">{reservation.requestingUserEmail}</a></p>
                  </div>
                  <div className="font-semibold">Requested Time:</div>
                  <div>{formatReservationTime(reservation.startAt)}</div>
                  <div className="font-semibold">Equipment:</div>
                  <div>
                    {reservation.moves.map((m) => `${m.equipmentLabel} (${formatDuration(m.durationMins)})`).join(", ")}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <TwicQuestion idPrefix="accept" value={twicEscortRequired} onChange={setTwicEscortRequired} />
          </div>
        )}
        <DialogFooter className="mx-0 mb-0">
          <Button variant="outline" onClick={close} disabled={isSubmitting}>Cancel</Button>
          <Button
            className="bg-green-600 hover:bg-green-600/90"
            onClick={handleAccept}
            disabled={twicEscortRequired === undefined || isSubmitting}
          >
            {isSubmitting ? "Accepting…" : "Yes, Accept"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
