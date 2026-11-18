import { useState } from "react";
import { DataTable } from "./data-table.tsx";
import { columns,CompletedColumn, OngoingColumn } from "./columns";
import {
  ReservationConfirmationDetails,
  ReservationConfirmationDialog,
} from "../reservation-cargo/reservation-confirmation-dialog.tsx";

interface TransportationBookingsTableProps {
  data: any[];
  status: string;
  meta: any;
}

export function TransportationBookingsTableUpcoming({ data, meta }: TransportationBookingsTableProps) {
  return (
    <DataTable columns={columns()} data={data} meta={meta} />
  );
}

export function TransportationBookingsTableOngoing({ data, meta }: TransportationBookingsTableProps) {
  // The confirmation lives here, not in the row: live updates refetch the rows as soon as a
  // reservation is requested, which would unmount anything rendered inside the row.
  const [confirmation, setConfirmation] = useState<ReservationConfirmationDetails | null>(null);

  async function closeConfirmation() {
    setConfirmation(null);
    await meta?.refreshBookings?.();
  }

  return (
    <>
      <DataTable columns={OngoingColumn()} data={data} meta={{ ...meta, showReservationConfirmation: setConfirmation }}/>
      <ReservationConfirmationDialog details={confirmation} onClose={closeConfirmation} />
    </>
  );
}

  export function TransportationBookingsTableCompleted({ data}: TransportationBookingsTableProps) {
    return (
      <DataTable columns={CompletedColumn()} data={data} />
    );
}
