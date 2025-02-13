import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag } from "lucide-react";
import { put } from 'aws-amplify/api';

async function updateBooking(id:string, status:string, transopName = "", transopEmail = "") {
  try {
    const bookingUpdate = {
      bookingStatus: status,
      transopName,
      transopEmail,
    };

    const restOperation = put({
      apiName: 'terminalopChangestatus', // Replace with your actual API name
      path: `terminalopChangestatus/${id}`, // Adjust the path as needed
      options: { body: bookingUpdate },
    });

    const response = await restOperation.response;
    console.log('Update successful:', response);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('Update failed:', e.message);
    } else {
      console.error('An unknown error occurred:', e);
    }
  }

}

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
      cell: ({ row }) => (
        <div className="flex space-x-4 justify-center">
          {/* Approve Button */}
          <Button
            variant="outline"
            className="text-green-700"
            onClick={() => updateBooking(row.original.id, "Pending Pick Up")}
          >
            Approve
          </Button>

          {/* Deny Button */}
          <Button
            variant="destructive"
            onClick={() => updateBooking(row.original.id, "unassigned", "", "")}
          >
            Deny
          </Button>
        </div>
      ),
    });
  }

  if (status === "Ongoing") {
    baseColumns.push({
      accessorKey: "status",
      header: " Status",
      cell: ({ row }) => {
        const status = row.original.status; // Get status value
        const isLate = status === "Late"; // Check if status is "Late"

        return (
          <span className={`px-2 py-1 rounded-md ${isLate ? "bg-red-500 text-white" : "bg-gray-200"}`}>
            {status}
          </span>
        );
      },
    },);

  }





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

baseColumns.push({
  accessorKey: "flag",
  header: () => <div style={{ minWidth: "200px", textAlign: "center" }}>Flag</div>,
  cell: ({ row }) => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%" }}>
      <FlagComponent initialFlagged={row.original.flagged} />
    </div>
  ),
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
      accessorKey: "status",
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

