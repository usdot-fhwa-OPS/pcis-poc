import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag } from "lucide-react";
import { Checkbox } from "../ui/checkbox.tsx"
import { TransOpUpcomingBookings } from "../../routes/booking.tsx";
//Four Imports needed for Amplify Data Queries and CRUD methods

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TransOpDataTableMeta } from "./data-table.tsx";

const client = generateClient<Schema>();
export const columns = (): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<TransOpUpcomingBookings>[] = [

    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "containerID", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { accessorKey: "transopName", header: "Terminal  Operator" },
    { accessorKey: "transopEmail", header: "Transportation Operator Email" },
    { accessorKey: "assignmentDate", header: "Date Requested" },
    {
      accessorKey: "status",
      header: () => <div style={{ minWidth: "200px", textAlign: "center" }}>Status</div>,
      cell: ({ row, table }) => (
        <div className="flex space-x-8 ">
          <Button 
            variant="outline" 
            className="text-green-700"
            onClick={() => (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(row.original.containerID, "Pending Booking")}
          >
            Approve
          </Button>

          <Button 
            variant="destructive"
            onClick={() => (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(row.original.containerID, "unassigned")}
          >
              Deny
          </Button>
        </div>
      ),
      
    },
    {
      accessorKey: "contact_bco",
      header: "Contact BCO",
      cell: ({ row }) => {
        const email = row.original.bcoEmail
  
        // Option A: Anchor tag wrapping a Button
        return (
          <a
            href={`mailto:${email}?subject=Inquiry%20About%20Cargo&body=Hello%20${row.original.bcoName},`}
          >
            <Button variant="outline">Contact</Button>
          </a>
        )
      },
    },

  ];

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
    { accessorKey: "vesselId", header: "Vessel ID" },
    { accessorKey: "containerId", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bco", header: "BCO" },
    { accessorKey: "bco_email", header: "BCO Email" },
    { accessorKey: "operator", header: "Terminal  Operator" },
    { accessorKey: "operator_email", header: "Transportation Operator Email" },
    {
      accessorKey: "status",
      header: "Booking Status",
      cell: ({ row }) => {
        const status = row.original.status; // Get status value
        const isLate = status === "Late"; // Check if status is "Late"

        return (
          <span className={`px-2 py-1 rounded-md ${isLate ? "bg-red-500 text-white" : "font-bold text-black bg-gray-300"} text-center block`}>
            {status}
          </span>
        );

      },
    },
    { accessorKey: "date_init", header: "Date Initiated" },
    { accessorKey: "date_approved", header: "Date Approved" },
    { accessorKey: "date_picked", header: "Date Picked Up" },
    

  ];
  return baseColumns;
};

export const OngoingColumn = (): ColumnDef<any>[] => {
  const baseColumns1: ColumnDef<any>[] = [
    { accessorKey: "vesselId", header: "Vessel ID" },
    { accessorKey: "containerId", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bco", header: "BCO" },
    { accessorKey: "bco_email", header: "BCO Email" },
    { accessorKey: "operator", header: "Transportation Operator" },
    { accessorKey: "operator_email", header: "Transportation Operator Email" },
    { accessorKey: "date_init", header: "Date Initiated" },
    { accessorKey: "date_updated", header: "Latest Update" },
    {
      accessorKey: "status",
      header: "Booking",
      cell: ({ row }) => {
        const [status, setStatus] = useState(row.original.status);
  
        return status === "Picked Up" ? (
          <span className="font-bold text-black bg-gray-300 px-2 py-1 rounded-md">Picked Up</span>
        ) : (
          <Button
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setStatus("Picked Up")}
          >
            Book
          </Button>
        );
      },
    },
    {
      id: "changepickupstatus",
      header: "Mark as Picked Up",
      cell: ({ row }) => {
        const [isChecked, setIsChecked] = useState(row.original.changepickupstatus === "checked");
  
        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => {
              
              if (isChecked)
                setIsChecked(false); // will add API calls here to chnage status 
              else
              setIsChecked(true);  //will add API calls here to chnage status

                console.log(`Checkbox clicked for row ${row.original.id}`);
              
            }}
          />
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
   
    {
      accessorKey: "contact_bco",
      header: "Contact BCO",
      cell: ({ row }) => (
        <Button
          variant="outline"
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => alert(`Contacting ${row.original.bco} at ${row.original.bco_email}`)}
        >
          Contact
        </Button>
      ),
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








