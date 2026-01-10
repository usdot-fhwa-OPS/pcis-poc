import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag } from "lucide-react";
import { BCODataTableMeta } from "./data-table.tsx";

//Four Imports needed for Amplify Data Queries and CRUD methods

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

import { format } from "date-fns";

import {
  SelectItem,
} from "../ui/select"
import { User } from "../users/columns.tsx";
import { SelectItemText } from "@radix-ui/react-select";
import { assignTransportationOperator } from "./assign_transportation_operator.tsx";

export const columns = (): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [
    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "containerID", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "destination", header: "Destination" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { 
      accessorKey: "transopName", 
      header: "Transportation  Operator",
      cell: ({ row, table }) => {

        const [tempName, setTempName] = useState("")
        const [tempEmail, setTempEmail] = useState("")
        const [isLoading, setIsLoading] = useState(true)
        const [isDialogOpen, setIsDialogOpen] = useState(false)

        // If either operator OR email is missing, show "Book" button
        const isMissing = !row.original.transopName?.trim() || !row.original.transopEmail?.trim()

        function handleSubmit() {
          // Use the parent's updateCargo method:
          (table.options.meta as BCODataTableMeta)?.assignTransOp(row.original.containerID, tempName, tempEmail, "Pending Transportation Operator Approval")
          setIsDialogOpen(false)
        }

        const [data, setData] = useState<User[]>([])
        
        const handleOpen = async () => {
          setIsDialogOpen(true)
          const result = await (table.options.meta as BCODataTableMeta)?.fetchTransportationOperators();
          setData(result)
          setIsLoading(false)
        }

        const handleOperatorSelect = (value: string) => {
          setTempEmail(value);
          const selectedUser = data.find(
            (user) => `${user.email}` === value
          );
          if (selectedUser) {
            setTempName( `${selectedUser.given_name} ${selectedUser.family_name}`);
          }
        };

        const getSelectItem = (user: User) => {
          const fullName = `${user.given_name} ${user.family_name}`;
          return (

            <SelectItem value={user.email}>
              <SelectItemText>
                {user["custom:organization"] ? user["custom:organization"] : fullName}
              </SelectItemText>

            </SelectItem>

          );
        };

        if (isMissing) {
          return (
            assignTransportationOperator(isDialogOpen, row, handleOpen,setIsDialogOpen, tempEmail, tempName,
                    isLoading, handleOperatorSelect, data,getSelectItem, handleSubmit
            )
          )
        }

        // If both operator and email are already filled, just display operator's name
        return <span>{row.original.transopName}</span>
      },
    },
    {
      accessorKey: "containerStatus",
      header: "Container Status",
      cell: ({ row }) => {
        const status = row.original.containerStatus; // Get status value
        const isOnShip = status === "On-Ship"; // Check if status is "Late"

        return (
          <span className={`px-2 py-1 rounded-md ${isOnShip ? "bg-blue-500 text-black rounded-md font-bold" : "font-bold text-black bg-purple-500 rounded-md"} text-center block`}>

            {status}
          </span>
        );

      }
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
    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "containerID", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "destination", header: "Destination" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { accessorKey: "transopName", header: "Transportation Operator Name" },
    { accessorKey: "transopEmail", header: "Transportation Operator Email" },
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
    { accessorKey: "containerID", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "destination", header: "Destination" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
  //  { accessorKey: "termopName", header: "Assigned Terminal Operator" },
    { accessorKey: "transopName", header: "Transportation Operator Name" },
    { accessorKey: "transopEmail", header: "Transportation Operator Email" },
    {
      accessorKey: "Booking Status",
      header: () => <div className="min-w-[150px] text-center "> Transportation Operator Status</div>,
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
      header: "Contact Transportation Operator",
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








