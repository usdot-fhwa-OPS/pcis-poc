import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag, XIcon, Check } from "lucide-react";
import {TerminalOperatorDataTableMeta} from './data-table.tsx'
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TermOperatorCompletedBookings } from "../../routes/reservation.tsx"
import { Checkbox } from "../ui/checkbox.tsx";
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
          <Button
            className="bg-green-500 hover:bg-green-500/90"
          >
            <Check className="inline-block h-4 w-4 mr-1" />Approve
          </Button>

          {/* Deny Button */}
          <Button
            variant="destructive"
          >
            <XIcon className="inline-block h-4 w-4 mr-1" />Deny
          </Button>

          {/* Old Approve Button */}
          <Button
            variant="outline"
            className="hidden text-green-700"
            onClick={() =>  (table.options.meta as TerminalOperatorDataTableMeta)?.updateBooking(row.original.cargoUnitID, "Pending Pick Up")} 
          >
            Approve
          </Button>

          {/* Old Deny Button */}
          <Button
            variant="destructive"
            className="hidden"
            onClick={() => (table.options.meta as TerminalOperatorDataTableMeta)?.updateBooking(row.original.cargoUnitID, "unassigned")} 
          >
            Deny
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
      header: () => <div className="w-[150px] text-center ">Status</div>,
     // Adjust width as needed
      cell: ({ row }) => {
        const status = row.original.reservationStatus; // Get status value
        const isLate = status === "Late for Pick Up"; // Check if status is "Late"
  
        return (
          <div className="w-[150px] flex justify-center">
          <span
            className={`px-2 py-1 text-sm font-bold rounded-md bg-gray-300 w-full ${
              isLate ? "text-red-500" : "text-black"
            } text-center whitespace-normal break-words`}
          >
            {status}
          </span>
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
      header: "Reservation Status",
      cell: ({ row }) => {
        const status = row.original.reservationStatus; // Get status value
        const isLate = status === "Late for Pick Up"; // Check if status is "Late"

        return (
          <div className="w-[150px] flex justify-center">
          <span
            className={`px-2 py-1 text-sm font-bold rounded-md bg-gray-300 w-full ${
              isLate ? "text-red-500" : "text-black"
            } text-center whitespace-normal break-words`}
          >
            {status}
          </span>
        </div>

        );
      },
      size: 200,
    },
    {
      accessorKey: "resPickupDate",
      header: "Reservation Pickup Date",
    },
  ];

  return baseColumns1;
};

