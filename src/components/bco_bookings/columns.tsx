import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useEffect, useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { BCODataTableMeta } from "./data-table.tsx";

//Four Imports needed for Amplify Data Queries and CRUD methods

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

const client = generateClient<Schema>();

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog"  
import { format } from "date-fns";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { User } from "../users/columns.tsx";
import { fetchAuthSession } from "aws-amplify/auth";

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

        const [open, setOpen] = useState(false)
        const [tempName, setTempName] = useState("")
        const [tempEmail, setTempEmail] = useState("")
        const [isLoading, setIsLoading] = useState(true)

        // If either operator OR email is missing, show "Book" button
        const isMissing = !row.original.transopName?.trim() || !row.original.transopEmail?.trim()

        function handleSubmit() {
          // Use the parent's updateCargo method:
          (table.options.meta as BCODataTableMeta)?.assignTransOp(row.original.containerID, tempName, tempEmail, "Pending Transportation Operator Approval")
          setOpen(false)
        }

        const [data, setData] = useState<User[]>([])
        
        useEffect(() => {
          async function fetchData() {
            try {
              const session = await fetchAuthSession();
              const response = await fetch("https://xlj2x9eurh.execute-api.us-east-1.amazonaws.com/dev/", {
                method: 'GET',
                headers: {
                  "Authorization": `Bearer ${session.tokens?.accessToken?.toString()}`,
                  "Content-Type": "application/json",
                  "Accept": "*/*"
                }
              });
              const result = await response.json();
              setData(result);
              setIsLoading(false)
            } catch (error) {
              throw new Error(`Failed to fetch data: ${error}`);
            }
          }
          fetchData();
        }, [])

        const handleOperatorSelect = (value: string) => {
          setTempName(value);
          const selectedUser = data.find(
            (user) => `${user.given_name} ${user.family_name}` === value
          );
          if (selectedUser) {
            setTempEmail(selectedUser.email);
          }
        };

        if (isMissing) {
          return (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">Assign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book Transportation Operator</DialogTitle>
                  <DialogDescription>
                  Enter a Transportation Operator name and email to assign this container.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2">
                  <div>
                    <Label>Transportation Operator Name</Label>
                    <Select value={tempName} onValueChange={handleOperatorSelect} disabled={isLoading}>
                      <SelectTrigger className="w-full">
                        <div className="flex items-center gap-2">
                          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                          <SelectValue placeholder="Select operator" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {data.map(user => {
                            const fullName = `${user.given_name} ${user.family_name}`;
                            return (
                              <SelectItem key={user.email} value={fullName}>
                                {fullName}
                              </SelectItem>
                            );
                          })}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Transportation Operator Email</Label>
                    <Input
                      value={tempEmail}
                      disabled={true}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={!tempName.trim() || !tempEmail.trim()}>
                    Submit
                    </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }

        // If both operator and email are already filled, just display operator's name
        return <span>{row.original.transopName}</span>
      },
    },
    {
      accessorKey: "containerStatus",
      header: "Booking Status",
      cell: ({ row }) => {
        const status = row.original.containerStatus; // Get status value
        const isOnShip = status === "On-Ship"; // Check if status is "Late"

        return (
          <span className={`px-2 py-1 rounded-md ${isOnShip ? "bg-blue-500 text-black rounded-full font-bold" : "font-bold text-black bg-purple-500 rounded-full"} text-center block`}>

            {status}
          </span>
        );

      }
    },
    { accessorKey: "arrivalDate", header: "Estimated Day of Arrival" },
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
    // { accessorKey: "port", header: "Port" },
    //{ accessorKey: "terminalId", header: "Terminal ID" },
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
      accessorKey: "to_status",
      header: "Booking Status",
      cell: ({ row }) => {
        const status = row.original.bookingStatus; // Get status value
    
        return (
          <span className="px-2 py-1 rounded-md bg-gray-300 text-black font-bold text-center block">
            {status}
          </span>
        );
      }
    },
    
    { accessorKey: "bookingDate", header: "Date Initiated" },
    { accessorKey: "bookingApprovalDate", header: "Date Approved" },
    { accessorKey: "bookingPickupDate", header: "Date Picked Up" },
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
      header: "Transportation Operator Status",
      cell: ({ row }) => {
        const status = row.original.bookingStatus; // Get status value
    
        return (
          <span className="px-2 py-1 rounded-md bg-gray-300 text-black font-bold text-center block">
            {status}
          </span>
        );
      }
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
header: () => <div style={{ minWidth: "200px", textAlign: "center" }}>Flag</div>,
cell: ({ row }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
    <FlagComponent initialFlagged={row.original.flagged} />
  </div>
),
});
return baseColumns1;
};








