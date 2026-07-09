import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag } from "lucide-react";

//Four Imports needed for Amplify Data Queries and CRUD methods

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

import { format } from "date-fns";

import TransportationCoordinator from "./assign_transportation_operator.tsx";
import { saveCargoUnit } from "../cargo/cargo-units-client.tsx";



export const columns = (): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [
    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "cargoUnitID", header: "Cargo Unit ID" }, 
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "destination", header: "Destination" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { 
      accessorKey: "transopName", 
      header: "Transportation Coordinator",
      cell: ({ row, table }) => <TransportationCoordinator row ={row} table={table} />
    },
    { accessorKey: "arrivalDate", header: "Estimated Day of Arrival" },
  ];


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
            <Button variant="ghost" onClick={handleFlagToggle} className="p-2">
              <Flag className={flagged ? "text-red-600" : "text-gray-400"} />
            </Button>
          )
  },
});
  return baseColumns;
};



export const CompletedColumn = (): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [
    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "cargoUnitID", header: "Cargo Unit ID" }, 
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "destination", header: "Destination" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { accessorKey: "transopName", header: "Transportation Coordinator Name" },
    { accessorKey: "transopEmail", header: "Transportation Coordinator Email" },
    {
      accessorKey: "to_status",
      header: () => <div className="w-[150px] text-center">Reservation Status</div>,
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
    
    { accessorKey: "reservationDate", header: "Date Initiated" },
    { accessorKey: "resApprovalDate", header: "Date Approved" },
    { accessorKey: "resPickupDate", header: "Date Picked Up" },
  ]
  return baseColumns;
};

export const OngoingColumn = (): ColumnDef<any>[] => {
  const baseColumns1: ColumnDef<any>[] = [
    
    // { accessorKey: "terminalId", header: "Terminal ID" },
    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "cargoUnitID", header: "Cargo Unit ID" }, 
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "destination", header: "Destination" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
  //  { accessorKey: "termopName", header: "Assigned Terminal Operator" },
    { accessorKey: "transopName", header: "Transportation Coordinator Name" },
    { accessorKey: "transopEmail", header: "Transportation Coordinator Email" },
    {
      accessorKey: "Booking Status",
      header: () => <div className="min-w-[150px] text-center "> Transportation Coordinator Status</div>,
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
      accessorKey: "contact_to",
      header: "Contact Transportation Coordinator",
      cell: ({ row }) => {
        const email = row.original.transopEmail
  
        // Option A: Anchor tag wrapping a Button
        return (
          <a
            href={`mailto:${email}?subject=Inquiry%20About%20Cargo&body=Hello%20${row.original.transopName},`}
          >
            <Button variant="outline" className="bg-blue-500 text-white hover:bg-blue-600">Contact</Button>
          </a>
        )
      },
    },
    { accessorKey: "updatedAt", 
      header: "Last Updated",
      cell: ({ row }) => {
        const rawDate = row.original.updatedAt;
        if (!rawDate) return null;
        const formattedDate = format(new Date(rawDate), "MM/dd/yyyy");
        return formattedDate;
      }
    }
    

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
header: () => <div style={{ minWidth: "50px", textAlign: "center" }}>Flag</div>,
cell: ({ row }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
    <FlagComponent initialFlagged={row.original.flagged} />
  </div>
),
});
return baseColumns1;
};








