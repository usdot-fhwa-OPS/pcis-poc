import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag } from "lucide-react";



export const columns = (): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [
    {accessorKey: "port", header: "Port" },
    { accessorKey: "terminalId", header: "Terminal ID" },
    { accessorKey: "vesselId", header: "Vessel ID" },
    { accessorKey: "containerId", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bco", header: "BCO" },
     { accessorKey: "bco_email", header: "BCO Email" },
    { accessorKey: "operator", header: "Transportation  Operator" },
    { accessorKey: "operator_email", header: "Transportation Operator Email" },
    {
      accessorKey: "status",
      header: "Booking Status",
      cell: ({ row }) => {
        const status = row.original.status; // Get status value
        const isOnShip = status === "On-Ship"; // Check if status is "Late"

        return (
          <span className={`px-2 py-1 rounded-md ${isOnShip ? "bg-blue-500 text-black rounded-full font-bold" : "font-bold text-black bg-purple-500 rounded-full"} text-center block`}>

            {status}
          </span>
        );

      }
    },
    { accessorKey: "eda", header: "Estimated Day of Arrival" },
    {
      accessorKey: "contact_bco",
      header: "Assign",
      cell: ({ row }) => (
        <Button
          variant="outline"
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => alert(`Contacting ${row.original.bco} at ${row.original.bco_email}`)}
        >
          Assign
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
  const baseColumns: ColumnDef<any>[] = [
    { accessorKey: "port", header: "Port" },
    { accessorKey: "terminalId", header: "Terminal ID" },
    { accessorKey: "vesselId", header: "Vessel ID" },
    { accessorKey: "containerId", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bco", header: "BCO" },
    { accessorKey: "bco_email", header: "BCO Email" },
    { accessorKey: "operator", header: "Assigned Transportation  Operator" },
    { accessorKey: "terminal_op", header: "Assigned Terminal Operator" },
    { accessorKey: "operator_email", header: "Transportation Operator Email" },
    {
      accessorKey: "to_status",
      header: "Booking Status",
      cell: ({ row }) => {
        const status = row.original.status; // Get status value
    
        return (
          <span className="px-2 py-1 rounded-md bg-gray-300 text-black font-bold text-center block">
            {status}
          </span>
        );
      }
    },
    
    { accessorKey: "date_init", header: "Date Initiated" },
    { accessorKey: "date_approved", header: "Date Approved" },
    { accessorKey: "date_picked", header: "Date Picked Up" },
  ]
  return baseColumns;
};

export const OngoingColumn = (): ColumnDef<any>[] => {
  const baseColumns1: ColumnDef<any>[] = [
    { accessorKey: "port", header: "Port" },
    { accessorKey: "terminalId", header: "Terminal ID" },
    { accessorKey: "vesselId", header: "Vessel ID" },
    { accessorKey: "containerId", header: "Container ID" },
    { accessorKey: "bco", header: "BCO" },
    { accessorKey: "bco_email", header: "BCO Email" },
    { accessorKey: "operator", header: "Assigned Transportation  Operator" },
    { accessorKey: "terminal_op", header: "Assigned Terminal Operator" },
    { accessorKey: "operator_email", header: "Transportation Operator Email" },
    {
      accessorKey: "to_status",
      header: "Transportation Operator Status",
      cell: ({ row }) => {
        const status = row.original.status; // Get status value
    
        return (
          <span className="px-2 py-1 rounded-md bg-gray-300 text-black font-bold text-center block">
            {status}
          </span>
        );
      }
    },
   
    {
      accessorKey: "contact_to",
      header: "Contact Trasnportation Operator",
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








