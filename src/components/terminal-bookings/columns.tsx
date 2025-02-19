import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag } from "lucide-react";
import {TerminalOperatorDataTableMeta} from './data-table.tsx'
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

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
    { accessorKey: "bookingDate", header: "Date Requested" },
    { accessorKey: "bookingTime", header: "Time Requested" },

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
  const baseColumns1: ColumnDef<any>[] = [
    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "containerID", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { accessorKey: "transopName", header: "Transportation Operator" },
    { accessorKey: "transopEmail", header: "Transportation Operator Email" },
    { accessorKey: "date_init", header: "Date Initiated" },
    { accessorKey: "date_approved", header: "Date Approved" },
    { accessorKey: "date_picked", header: "Date Picked Up" },
    {
      accessorKey: "bookingStatus",
      header: "Booking Status",
      cell: ({ row }) => {
        const status = row.original.status; // Get status value
        const isLate = status === "Late"; // Check if status is "Late"

        return (
          <span className={`px-2 py-1 rounded-md ${isLate ? "bg-red-500 text-white" : "bg-gray-200"} text-center block`}>
            {status}
          </span>
        );
      },
    },

  ];



 




// Clickable Flag Component
const FlagComponent = ({ initialFlagged = false }) => {
  const [flagged, setFlagged] = useState(initialFlagged);

  return (
    <Button
      onClick={() => setFlagged(!flagged)}
      variant="ghost"
      className={`flex items-center space-x-2 ${flagged ? "text-red-500" : "text-gray-500"}`}
    >
      <Flag className={`w-5 h-5 ${flagged ? "fill-red-500 stroke-red-500" : "stroke-gray-500"}`} />
    </Button>
  );
};

baseColumns1.push({
  accessorKey: "flag",
  header: () => <div style={{ minWidth: "200px", textAlign: "center" }}>Flag</div>,
  cell: ({ row }) => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
      <FlagComponent initialFlagged={row.original.flagged} />
    </div>
  ),
});
  return baseColumns1;
};

