import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Check, Pencil, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { DataTable } from "../terminal-bookings/data-table.tsx";
import { AcceptReservationDialog } from "../reservations/approve-reservation";
import { DenyReservationDialog } from "./deny-reservation-dialog";
import { ModifyReservationDialog } from "./modify-reservation-dialog";
import { listReservationRequests, ReservationForReview } from "./reservation-manager-client";
import { formatDuration, formatReservationTime } from "./reservation-format";

type ReviewAction = { type: "accept" | "modify" | "deny"; reservation: ReservationForReview };

type ReviewRow = {
  reservation: ReservationForReview;
  confirmationCode: string;
  cargoUnitID: string;
  vesselID: string;
  bcoName: string;
  transopName: string;
  transopEmail: string;
  startAt: string;
  equipment: string;
  durationMins: number;
};

function toRow(reservation: ReservationForReview): ReviewRow {
  const first = reservation.moves[0];
  return {
    reservation,
    confirmationCode: reservation.confirmationCode,
    cargoUnitID: reservation.moves.map((m) => m.cargoUnitID).join(", "),
    vesselID: [...new Set(reservation.moves.map((m) => m.vesselID).filter(Boolean))].join(", "),
    bcoName: [...new Set(reservation.moves.map((m) => m.bcoName).filter(Boolean))].join(", "),
    transopName: first?.transopName || reservation.requestingUserName || "",
    transopEmail: reservation.requestingUserEmail,
    startAt: reservation.startAt,
    equipment: reservation.moves.map((m) => m.equipmentLabel).join(", "),
    durationMins: reservation.durationMins,
  };
}

type ReservationReviewQueueProps = {
  // Bump to reload, e.g. from the live cargo-update channel.
  refreshKey?: number;
};

// I-4: the Terminal Operator's queue of REQUESTED reservations for their terminals (from the new
// Reservations tables), with Accept, Modify and Deny. The dialogs live here rather than in the rows
// so a live refresh of the rows can't close a dialog the TO is working in.
export function ReservationReviewQueue({ refreshKey }: ReservationReviewQueueProps) {
  const [reservations, setReservations] = useState<ReservationForReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [action, setAction] = useState<ReviewAction | null>(null);

  const load = useCallback(async () => {
    try {
      setReservations(await listReservationRequests());
      setError(undefined);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const closeAction = useCallback(() => setAction(null), []);
  const finishAction = useCallback(async () => {
    setAction(null);
    await load();
  }, [load]);

  const columns = useMemo<ColumnDef<ReviewRow>[]>(
    () => [
      { accessorKey: "confirmationCode", header: "Confirmation Code" },
      { accessorKey: "cargoUnitID", header: "Cargo Unit ID" },
      { accessorKey: "vesselID", header: "Vessel ID" },
      { accessorKey: "bcoName", header: "BCO" },
      {
        accessorKey: "transopName",
        header: "Transportation Coordinator",
        cell: ({ row }) => (
          <div>
            <p>{row.original.transopName || "—"}</p>
            <p className="text-xs text-gray-500 break-all">{row.original.transopEmail}</p>
          </div>
        ),
      },
      {
        accessorKey: "startAt",
        header: "Requested Time",
        cell: ({ row }) => <span className="whitespace-nowrap">{formatReservationTime(row.original.startAt)}</span>,
      },
      { accessorKey: "equipment", header: "Equipment" },
      {
        accessorKey: "durationMins",
        header: "Est. Duration",
        cell: ({ row }) => formatDuration(row.original.durationMins),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Review</div>,
        cell: ({ row }) => {
          const reservation = row.original.reservation;
          return (
            <div className="min-w-[260px] flex gap-2 justify-center">
              <Button size="sm" className="bg-green-600 hover:bg-green-600/90" onClick={() => setAction({ type: "accept", reservation })}>
                <Check className="inline-block h-4 w-4" />Accept
              </Button>
              <Button size="sm" variant="outline" onClick={() => setAction({ type: "modify", reservation })}>
                <Pencil className="inline-block h-4 w-4" />Modify
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setAction({ type: "deny", reservation })}>
                <XIcon className="inline-block h-4 w-4" />Deny
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  const rows = useMemo(() => reservations.map(toRow), [reservations]);

  return (
    <>
      {error && <p className="mb-2 text-sm text-red-600">Couldn't load reservation requests: {error}</p>}
      {isLoading && <p className="mb-2 text-sm text-gray-500">Loading reservation requests…</p>}
      <DataTable columns={columns} data={rows} />

      <AcceptReservationDialog
        reservation={action?.type === "accept" ? action.reservation : null}
        onClose={closeAction}
        onDone={finishAction}
      />
      <ModifyReservationDialog
        reservation={action?.type === "modify" ? action.reservation : null}
        onClose={closeAction}
        onDone={finishAction}
      />
      <DenyReservationDialog
        reservation={action?.type === "deny" ? action.reservation : null}
        onClose={closeAction}
        onDone={finishAction}
      />
    </>
  );
}
