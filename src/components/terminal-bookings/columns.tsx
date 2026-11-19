import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag, XIcon, ShieldHalf } from "lucide-react";
import {TerminalOperatorDataTableMeta} from './data-table.tsx'
import { TermOperatorCompletedBookings } from "../../routes/reservation.tsx"
import { ApproveReservation } from "../reservations/approve-reservation.tsx";
import { Badge } from "../ui/badge.tsx";
import { saveCargoUnit } from "../cargo/cargo-units-client.tsx";
import { ReservationStatusBadge, RecordOutcomeCell } from "../reservations/reservation-status.tsxion-status.tsx";


export const columns = (status: string): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [
    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "cargoUnitID", header: "Cargo Unit ID" }, 
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { accessorKey: "transopName", header: "Transportation Coordinator" },
    { accessorKey: "transopEmail", header: "Transportation Coordinator Email" },
    { accessorKey: "reservationDate", header: "Date Requested" },
    { accessorKey: "reservationTime", header: "Time Requested" },
  ];



  if (status === "Requested") {
    baseColumns.push({
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row,table }) => (
        <div className="min-w-[200px] flex space-x-4 justify-center">

          {/* Approve Button */}
          <ApproveReservation
            vesselId = {(row.original.vesselID)}
            cargoId = {(row.original.cargoUnitID)}
            origin = {(row.original.origin)}
            bcoName = {(row.original.bcoName)}
            bcoEmail = {(row.original.bcoEmail)}
            transopName = {(row.original.transopName)}
            transopEmail = {(row.original.transopEmail)}
            reservationDate = {(row.original.reservationDate)}
            reservationTime = {(row.original.reservationTime)}
            dataTableMeta = {(table.options.meta)}
          />

          {/* Deny Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => (table.options.meta as TerminalOperatorDataTableMeta)?.updateBooking(row.original.cargoUnitID, "unassigned")} 
          >
            <XIcon className="inline-block h-4 w-4" />Deny
          </Button>
        </div>
      ),
    });
  }

  if (status === "Modified") {
    baseColumns.push({
      accessorKey: "modifiedReservationDate",
      header: "Modified Date Requested",
    });
    baseColumns.push({
      accessorKey: "modifiedReservationTime",
      header: "Modified Time Requested",
    });
    baseColumns.push({
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row,table }) => (
        <div className="min-w-[200px] flex space-x-4 justify-center">
          {/* Approve Button */}

          {/* Modify selection set to include modified time and date
              Modify function to pass modified time and date
  
          */}
          <Button
            variant="outline"
            className="text-green-700"
            onClick={() =>  (table.options.meta as TerminalOperatorDataTableMeta)?.updateBooking(row.original.cargoUnitID, "Pending Pick Up", row.original.modifiedReservationDate, row.original.modifiedReservationTime)} 
          >
            Approve
          </Button>
          
          {/* Deny Button */}
          <Button
            variant="destructive"
            onClick={() => (table.options.meta as TerminalOperatorDataTableMeta)?.updateBooking(row.original.cargoUnitID, "unassigned")} 
          >
            Deny
          </Button>
        </div>
      ),
    });
  }

  if (status === "Ongoing") {
    baseColumns.push({
        accessorKey: "reservationStatus",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <ReservationStatusBadge
            reservationDate={row.original.reservationDate}
            reservationTime={row.original.reservationTime}
            reservationStatus={row.original.reservationStatus}
          />
        ),
      },
    {
      id: "recordOutcome",
      header: () => <div className="text-center">Record Outcome</div>,
      cell: ({ row, table }) => (
        <RecordOutcomeCell row={row} table={table} />
      ),
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: "twicEscortRequired",
      header: () => <div>
          <abbr className="decoration-[1px] decoration-dotted underline-offset-4" title="Transportation Worker Identification Credential">TWIC</abbr>
          <svg width="0" height="0">
            <linearGradient id="shieldhalf-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop stopColor="#ff6467" offset="50%" />
              <stop stopColor="#ffffff" offset="50%" />
            </linearGradient>
          </svg>
        </div>, // Includes svg gradient fill for ShieldHalf icon, left side fill is red-400
      cell: ({ row }) => {
        const required = row.original.twicEscortRequired; // Get TWIC value
        
        if (required === true) {
          return (
            <div className="min-w-[164px]">
              <Badge 
                className="border-amber-200 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100/80 gap-1"
              >
                <ShieldHalf fill="url(#shieldhalf-icon-gradient)" className="inline-block w-4 h-4 text-gray-600" />
                TWIC Escort Required
              </Badge>
            </div>
          );
        } else {
          return (
            <span className="text-gray-400 font-semibold">&mdash;</span>
          )
        }
      }
    });
  }
  
  baseColumns.push({
    accessorKey: "flag",
    header: () => <div className="text-center">Flag</div>,
    cell: ({ row }) => {
      

     
      // Initialize flagged state from the row data; fallback to false if undefined.
            const [flagged, setFlagged] = useState<boolean>(row.original.flag || false)
      
            // Function to handle flag toggling.
            const handleFlagToggle = async () => {
              const newFlag = !flagged
              // Optimistically update the UI.
              setFlagged(newFlag)
              try {
                // Call the Amplify update method for the flag (again must always contain containerID)
                const updatedContainerStatus = await saveCargoUnit({
                  cargoUnitID: row.original.cargoUnitID,
                  flag: newFlag,
                })              

                console.log("Updated flag:", updatedContainerStatus)
              } catch (error) {
                console.error("Error updating flag:", error);
              }
            }
      
            return (
              <div className="text-center">
                <Button variant="ghost" onClick={handleFlagToggle} className="p-2">
                  <Flag className={flagged ? "text-red-600" : "text-gray-500"} />
                </Button>
              </div>
            )
    },
  });

  return baseColumns;
};

export const CompletedColumn = (): ColumnDef<any>[] => {
  const baseColumns1: ColumnDef<TermOperatorCompletedBookings>[] = [
    {
      accessorKey: "vesselID",
      header: "Vessel ID",
    },
    {
      accessorKey: "cargoUnitID", 
      header: "Cargo Unit ID",
    },
    {
      accessorKey: "origin",
      header: "Origin",
    },
    {
      accessorKey: "bcoName",
      header: "BCO",
    },
    {
      accessorKey: "bcoEmail",
      header: () => "BCO Email",
    },
    {
      accessorKey: "transopName",
      header: "Transportation Coordinator",
    },
    {
      accessorKey: "transopEmail",
      header: "Transportation Coordinator Email",
    },
    {
      accessorKey: "reservationDate",
      header: "Reservation Date",
    },
    {
      accessorKey: "reservationTime",
      header: "Reservation Time",
    },
    {
      accessorKey: "resApprovalDate",
      header: "Date Approved",
    },
    {
      accessorKey: "resPickupDate",
      header: "Date Picked Up",
    },
    {
      accessorKey: "reservationStatus",
      header: () => (
        <div className="min-w-[112px] text-center">Reservation Status</div>
      ),
      cell: ({ row }) => (
        <ReservationStatusBadge
          reservationDate={row.original.reservationDate}
          reservationTime={row.original.reservationTime}
          reservationStatus={row.original.reservationStatus}
        />
      ),
    },
    {
      accessorKey: "twicEscortRequired",
      header: () => <div>
          <abbr className="decoration-[1px] decoration-dotted underline-offset-4" title="Transportation Worker Identification Credential">TWIC</abbr>
          <svg width="0" height="0">
            <linearGradient id="shieldhalf-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop stopColor="#ff6467" offset="50%" />
              <stop stopColor="#ffffff" offset="50%" />
            </linearGradient>
          </svg>
        </div>, // Includes svg gradient fill for ShieldHalf icon, left side fill is red-400
      cell: ({ row }) => {
        const required = row.original.twicEscortRequired; // Get TWIC value
        
        if (required === true) {
          return (
            <div className="min-w-[172px]">
              <Badge 
                className="border-green-100 rounded-full bg-green-50 text-green-600 hover:bg-green-50/80 gap-1"
              >
                <ShieldHalf fill="url(#shieldhalf-icon-gradient)" className="inline-block w-4 h-4 text-gray-600" />
                TWIC Escort Completed
              </Badge>
            </div>
          );
        } else {
          return (
            <span className="text-gray-400 font-semibold">&mdash;</span>
          )
        }
      },
    }
  ];

  return baseColumns1;
};

