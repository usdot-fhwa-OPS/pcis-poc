import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag } from "lucide-react";
import { Checkbox } from "../ui/checkbox.tsx"
import { TransOperatorCompletedBookings } from "../../routes/booking"


export const columns = (): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<any>[] = [

    { accessorKey: "vesselId", header: "Vessel ID" },
    { accessorKey: "containerId", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bco", header: "BCO" },
     { accessorKey: "bco_email", header: "BCO Email" },
    { accessorKey: "operator", header: "Terminal  Operator" },
    { accessorKey: "operator_email", header: "Transportation Operator Email" },
    { accessorKey: "date", header: "Date Requested" },
    { accessorKey: "time", header: "Time Requested" },
    {
      accessorKey: "status",
      header: () => <div style={{ minWidth: "200px", textAlign: "center" }}>Status</div>,
      cell: () => (
        <div className="flex space-x-8 ">
          <Button variant="outline" className="text-green-700">
  Approve
</Button>

          <Button variant="destructive">Deny</Button>
        </div>
      ),
      
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
  const baseColumns: ColumnDef<TransOperatorCompletedBookings>[] = [
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
          <span className={`px-2 py-1 rounded-md ${isLate ? "bg-red-500 text-white" : "font-bold text-black bg-gray-300"} text-center block`}>
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








