import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag, XIcon, ShieldHalf } from "lucide-react";
import {TerminalOperatorDataTableMeta} from './data-table.tsx'
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TermOperatorCompletedBookings } from "../../routes/reservation.tsx"
import { Checkbox } from "../ui/checkbox.tsx";
import { ApproveReservation } from "../reservations/approve-reservation.tsx";
import { Badge } from "../ui/badge.tsx";
const client = generateClient<Schema>();
export const columns = (status: string): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [

    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "cargoUnitID", header: "Cargo Unit ID" }, 
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { accessorKey: "transopName", header: "Transportation Coordinator" },
    { accessorKey: "transopEmail", header: "Transportation Coordinator Email" },
    { accessorKey: "reservationDate", header: "Original Date Requested" },
    { accessorKey: "reservationTime", header: "Original Time Requested" },
  

  ];



  if (status === "Requested") {
    baseColumns.push({
      accessorKey: "status",
      header: () => <div className="text-center min-w-[200px]">Status</div>,
      cell: ({ row,table }) => (
        <div className="flex space-x-4 justify-center">

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
      header: () => <div className="text-center min-w-[200px]">Status</div>,
      cell: ({ row,table }) => (
        <div className="flex space-x-4 min-w-[200px] justify-center">
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
      header: () => <div className="w-[150px] text-center">Status</div>,
     // Adjust width as needed
      cell: ({ row }) => {
        const status = row.original.reservationStatus; // Get status value
        const isLate = status === "Late for Pick Up"; // Check if status is "Late"
  
        return (
          <div className="w-[150px] text-center">
            <Badge
              className={`border-transparent rounded-full ${
                isLate ? "bg-red-100 hover:bg-red-100/80 text-red-700" : "bg-blue-50 hover:bg-blue-50/80 text-blue-700"
              } whitespace-normal break-words`}
            >
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      id: "changepickupstatus",
      header: "Mark as Late for Pick Up",
      cell: ({ row, table}) => {
        const [isChecked, setIsChecked] = useState<boolean>(row.original.reservationStatus === "Late for Pick Up");
  
        const markLateforPickup = async () => {
          const success = await (table.options.meta as TerminalOperatorDataTableMeta)?.markBookingLate(
            row.original.cargoUnitID,  
            "Late for Pick Up",
          );
          
          if (success) {
            setIsChecked((prev) => !prev);
          } else {
            console.error("Booking update failed. State not updated.");
          }
        };

        return (
          <Checkbox
            disabled={row.original.reservationStatus == "Late for Pick Up"}
            checked={isChecked}
            onCheckedChange={markLateforPickup}
          />
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: "twicEscortRequired",
      header: "TWIC",
      cell: ({ row }) => {
        const required = row.original.twicEscortRequired; // Get TWIC value
        
        if (required === true) {
          return (
            <div className="min-w-[164px]">
              <Badge 
                className="border-amber-200 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100/80 gap-1"
              >
                <ShieldHalf fill="#fff" className="inline-block w-4 h-4" />
                TWIC Escort Required
              </Badge>
            </div>
          );
        }
      }
    });
  }
  

  baseColumns.push({
    accessorKey: "flag",
    header: () => <div style={{ minWidth: "50px", textAlign: "center" }}>Flag</div>,
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
                const { data: updatedContainerStatus } = await client.models.Container.update({
                  cargoUnitID: row.original.cargoUnitID, 
                  flag: newFlag,
                })
                console.log("Updated flag:", updatedContainerStatus)
              } catch (error) {
                console.error("Error updating flag:", error);
              }
            }
      
            return (
              <div className="flex space-x-4 justify-center">
              <Button variant="ghost" onClick={handleFlagToggle} className="p-2">
                <Flag className={flagged ? "text-red-600" : "text-gray-400"} />
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
      header: "Reservation Approval Date",
    },
    {
      accessorKey: "reservationStatus",
      header: () => <div className="min-w-[112px] text-center">Reservation Status</div>,
      cell: ({ row }) => {
        const status = row.original.reservationStatus; // Get status value
        const isLate = status === "Late for Pick Up"; // Check if status is "Late"

        return (
          <div className="min-w-[112px] text-center">
            <Badge
              className={`border-transparent rounded-full ${
                isLate ? "bg-red-100 hover:bg-red-100/80 text-red-700" : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
              } whitespace-normal break-words`}
            >
              {status}
            </Badge>
          </div>

        );
      },
      size: 200,
    },
    {
      accessorKey: "resPickupDate",
      header: "Reservation Pickup Date",
    },
    {
      accessorKey: "twicEscortRequired",
      header: "TWIC",
      cell: ({ row }) => {
        const required = row.original.twicEscortRequired; // Get TWIC value
        
        if (required === true) {
          return (
            <div className="min-w-[172px]">
              <Badge 
                className="border-green-100 rounded-full bg-green-50 text-green-600 hover:bg-green-50/80 gap-1"
              >
                <ShieldHalf fill="#fff" className="inline-block w-4 h-4" />
                TWIC Escort Confirmed
              </Badge>
            </div>
          );
        }
      },
    }
  ];

  return baseColumns1;
};

