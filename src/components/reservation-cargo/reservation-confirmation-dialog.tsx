import { useState } from "react";
import { Check, Copy, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { formatDuration, formatReservationTime } from "./reservation-format";

export type ReservationConfirmationDetails = {
  confirmationCode: string;
  cargoUnitID: string;
  startAt: string;
  durationMins: number;
  equipmentLabel: string;
};

type ReservationConfirmationDialogProps = {
  details: ReservationConfirmationDetails | null;
  onClose: () => void;
};

export function ReservationConfirmationDialog({ details, onClose }: ReservationConfirmationDialogProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!details) return;
    try {
      await navigator.clipboard.writeText(details.confirmationCode);
      setCopied(true);
      toast.success("Confirmation code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the code. Select it and copy it manually.");
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setCopied(false);
      onClose();
    }
  }

  return (
    // The user closes this with Done, the X button or Escape, so the code isn't dismissed by a stray click.
    <Dialog open={details !== null} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-[440px] text-left">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Pickup Requested</DialogTitle>
          <DialogDescription>
            Your request was sent to the terminal for review.
          </DialogDescription>
        </DialogHeader>

        {details && (
          <div className="grid gap-4 py-1">
            <div className="grid gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Confirmation Code</span>
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                <span className="select-all font-mono text-xl font-semibold tracking-wider">
                  {details.confirmationCode}
                </span>
                <Button variant="outline" size="sm" onClick={copyCode} aria-label="Copy confirmation code">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <span className="font-semibold">Save this confirmation code.</span> Guest users can use it to check the status of this reservation without a PCIS account.
              </p>
            </div>

            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-muted-foreground">Cargo Unit ID</dt>
              <dd>{details.cargoUnitID}</dd>
              <dt className="text-muted-foreground">Requested Time</dt>
              <dd>{formatReservationTime(details.startAt)}</dd>
              <dt className="text-muted-foreground">Equipment</dt>
              <dd>{details.equipmentLabel}</dd>
              <dt className="text-muted-foreground">Estimated Duration</dt>
              <dd>{formatDuration(details.durationMins)}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>Requested, awaiting terminal review</dd>
            </dl>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => handleOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
