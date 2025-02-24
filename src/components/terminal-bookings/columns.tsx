import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag } from "lucide-react";
import {TerminalOperatorDataTableMeta} from './data-table.tsx'
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TermOperatorCompletedBookings } from "../../routes/booking"

const client = generateClient<Schema>();
export const columns = (status: string): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [

    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "containerID", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { accessorKey: "transopName", header: "Transportation Operator" },
    { accessorKey: "transopEmail", header: "Transportation Operator Email" },
    { accessorKey: "bookingDate", header: "Original Date Requested" },
    { accessorKey: "bookingTime", header: "Original Time Requested" },

  ];



  if (status === "Requested") {
    baseColumns.push({
      accessorKey: "status",
      header: () => <div className="text-center min-w-[200px]">Status</div>,
      cell: ({ row,table }) => (
        <div className="flex space-x-4 justify-center">
          {/* Approve Button */}
          <Button
            variant="outline"
            className="text-green-700"
            onClick={() =>  (table.options.meta as TerminalOperatorDataTableMeta)?.updateBooking(row.original.containerID, "Pending Pick Up")}
          >
            Approve
          </Button>

          {/* Deny Button */}
          <Button
            variant="destructive"
            onClick={() => (table.options.meta as TerminalOperatorDataTableMeta)?.updateBooking(row.original.containerID, "unassigned")}
          >
            Deny
          </Button>
        </div>
      ),
    });
  }

  if (status === "Modified") {
    baseColumns.push({
      accessorKey: "modifiedBookingDate",
      header: "Modified Date Requested",
    });
    baseColumns.push({
      accessorKey: "modifiedBookingTime",
      header: "Modified Time Requested",
    });
    baseColumns.push({
      accessorKey: "status",
      header: () => <div className="text-center min-w-[200px]">Status</div>,
      cell: ({ row,table }) => (
        <div className="flex space-x-4 justify-center">
          {/* Approve Button */}

          {/* Modify selection set to include modified time and date
              Modify function to pass modified time and date
  
          */}
          <Button
            variant="outline"
            className="text-green-700"
            onClick={() =>  (table.options.meta as TerminalOperatorDataTableMeta)?.updateBooking(row.original.containerID, "Pending Pick Up", row.original.modifiedBookingDate, row.original.modifiedBookingTime)}
          >
            Approve
          </Button>
          
          {/* Deny Button */}
          <Button
            variant="destructive"
            onClick={() => (table.options.meta as TerminalOperatorDataTableMeta)?.updateBooking(row.original.containerID, "unassigned")}
          >
            Deny
          </Button>
        </div>
      ),
    });
  }

  if (status === "Ongoing") {
    baseColumns.push({
      accessorKey: "bookingStatus",
      header: () => <div className="text-center min-w-[150px]">Status</div>,
     // Adjust width as needed
      cell: ({ row }) => {
        const status = row.original.bookingStatus; // Get status value
        const isLate = status === "Late"; // Check if status is "Late"
  
        return (
          <span className={`flex justify-center items-center px-4 py-2 rounded-md ${isLate ? "bg-red-500 text-white" : "bg-gray-600 text-white"}`}>
            {status}
          </span>
        );
      },
    });
  }
  

  baseColumns.push({
    accessorKey: "flag",
    header: () => <div style={{ minWidth: "200px", textAlign: "center" }}>Flag</div>,
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
                  containerID: row.original.containerID,
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
      header: () => <div className="text-center">Vessel ID</div>,
    },
    {
      accessorKey: "containerID",
      header: () => <div className="text-center">Container ID</div>,
    },
    {
      accessorKey: "origin",
      header: () => <div className="text-center">Origin</div>,
    },
    {
      accessorKey: "bcoName",
      header: () => <div className="text-center">BCO</div>,
    },
    {
      accessorKey: "bcoEmail",
      header: () => <div className="text-center">BCO Email</div>,
    },
    {
      accessorKey: "transopName",
      header: () => <div className="text-center">Transportation Operator</div>,
    },
    {
      accessorKey: "transopEmail",
      header: () => <div className="text-center">Transportation Operator Email</div>,
    },
    {
      accessorKey: "bookingDate",
      header: () => <div className="text-center">Booking Date</div>,
    },
    {
      accessorKey: "bookingApprovalDate",
      header: () => <div className="text-center">Booking Approval Date</div>,
    },
    {
      accessorKey: "bookingStatus",
      header: () => <div className="text-center">Booking Status</div>,
      cell: ({ row }) => {
        const status = row.original.bookingStatus; // Get status value
        const isLate = status === "Late"; // Check if status is "Late"

        return (
          <span className={`px-2 py-1 rounded-md ${isLate ? "bg-red-500 text-white" : "bg-gray-200"} text-center block`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "bookingPickupDate",
      header: () => <div className="text-center">Booking Pickup Date</div>,
    },
    {
      accessorKey: "bookingTime",
      header: () => <div className="text-center">Booking Time</div>,
    },
  ];

  return baseColumns1;
};

