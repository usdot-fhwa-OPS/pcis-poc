import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button.tsx";
import { useState, useEffect} from "react";
import { Flag, CalendarIcon, Clock, Pencil} from "lucide-react";
//import { Checkbox } from "../ui/checkbox.tsx"
import { Calendar } from "../ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import { format } from "date-fns"
import { cn } from "../../lib/utils"
import { TransOpUpcomingBookings, TransOpOngoingBookings } from "../../routes/booking.tsx";
//Four Imports needed for Amplify Data Queries and CRUD methods

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TransOpDataTableMeta } from "./data-table.tsx";

const client = generateClient<Schema>();
import { TransOperatorCompletedBookings } from "../../routes/booking"
import { Checkbox } from "../ui/checkbox.tsx";


export const columns = (): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<TransOpUpcomingBookings>[] = [

    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "containerID", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { accessorKey: "transopName", header: "Transportation Operator" },
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
  const baseColumns1: ColumnDef<TransOpOngoingBookings>[] = [
    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "containerID", header: "Container ID" },
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Email" },
    { accessorKey: "transopName", header: "Transportation Operator" },
    { accessorKey: "transopEmail", header: "Transportation Operator Email" },
    { accessorKey: "bookingDate", header: "Date Initiated" },
    { accessorKey: "bookingTime", header: "Time Initiated" },
    {
      accessorKey: "status",
      header: "Booking",
      cell: ({ row, table }) => {

        const [date, setDate] = useState<Date | undefined>(undefined)
        const [time, setTime] = useState<string | undefined>(undefined)
        const [isCalendarOpen, setIsCalendarOpen] = useState(false)
        const [isDialogOpen, setIsDialogOpen] = useState(false)
        const [limit, setLimit] = useState<number>();
        const [bookingsLength, setBookingsLength] = useState<number>(0);
        
        const isDateTimeSelected = (): boolean => {
          return !!date && !!time
        }

        useEffect(() => {
          const limitSub = client.models.Limit.observeQuery().subscribe({
            next: ({ items }) => {
              setLimit(items[0].portCapacity);
            },
          });
          return () => limitSub.unsubscribe();
        }, []);

        useEffect(() => {
          const bookingSub = client.models.Container.observeQuery(
            // {
            //   filter: {
            //     bookingDate: {
            //       eq: String(format(date!, "MM/dd/yyyy"))}
            //   }
            // }
          ).subscribe({  
            next: ({ items }) => {
              setBookingsLength(items.length);
            },
          });
          return () => bookingSub.unsubscribe();
        }, []);

        const handleBooking = async () => {
          // try{
          //   const {data: bookings} = await client.models.Container.list({
          //     authMode: 'apiKey',
          //     filter: {
          //       bookingDate: {
          //         eq: String(format(date!, "MM/dd/yyyy"))
          //       }
          //     }
          //   })
          //   console.log(String(format(date!, "MM/dd/yyyy")));
          //   console.log("Bookings: ", bookings);
          //   setBookingsLength(bookings.length);
          // } catch {
          //   console.error("Error fetching bookings")
          // }

          console.log("Bookings Length: ", bookingsLength)
          console.log("Limit: ", limit)
          if (bookingsLength >= limit!) {
            alert("Booking limit reached. Please try again later.")
          } else {
            (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(row.original.containerID, "Pending Booking Approval", String(format(date!, "MM/dd/yyyy")), time ?? "")
            setIsDialogOpen(false)
          }
          
        }

        const timeOptions = [
          "12:00 AM",
          "01:00 AM",
          "02:00 AM",
          "03:00 AM",
          "04:00 AM",
          "05:00 AM",
          "06:00 AM",
          "07:00 AM",
          "08:00 AM",
          "09:00 AM",
          "10:00 AM",
          "11:00 AM",
          "12:00 PM",
          "01:00 PM",
          "02:00 PM",
          "03:00 PM",
          "04:00 PM",
          "05:00 PM",
          "06:00 PM",
          "07:00 PM",
          "08:00 PM",
          "09:00 PM",
          "10:00 PM",
          "11:00 PM",
        ]

        const handleDateSelect = (selectedDate: Date | undefined) => {
          setDate(selectedDate)
          // Keep the calendar open after selection
          setIsCalendarOpen(true)
        }

        return row.original.bookingStatus === "Pending Booking" ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger>
                  <Button variant="outline" onClick={() => setIsDialogOpen(true)} disabled={row.original.containerStatus === "On Ship"}>Book</Button>
                </TooltipTrigger>
                {row.original.containerStatus === "On Ship" && (
                  <TooltipContent>
                    <p>Container still on ship. Cannot book.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Book Container Pick-Up</DialogTitle>
                <div className="text-sm text-muted-foreground">
                  {`Vessel ID: ${row.original.vesselID} | Container ID: ${row.original.containerID} | Origin: ${row.original.origin} | BCO: ${row.original.bcoName} | BCO Email: ${row.original.bcoEmail}`}
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <CalendarIcon className="h-4 w-4" />
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                        onClick={() => setIsCalendarOpen(true)}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "MM/dd/yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={date} disabled={{ before: new Date()}} onSelect={handleDateSelect} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Clock className="h-4 w-4" />
                  <Select onValueChange={setTime}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((timeOption) => (
                        <SelectItem key={timeOption} value={timeOption}>
                          {timeOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {isDateTimeSelected()
                    ? `Selected: ${format(date!, "MM/dd/yyyy")} ${time}`
                    : "Please select both date and time"}
                </div>
                <Button 
                  type="submit" 
                  disabled={!date || !time} 
                  variant={!date || !time ? "outline" : "default"}
                  onClick={handleBooking}
                >
                  Book
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
            <span className="font-bold text-black bg-gray-300 px-2 py-1 rounded-md">{row.original.bookingStatus}</span>
          );
      },
    },
    {
      id: "changepickupstatus",
      header: "Mark as Picked Up",
      cell: ({ row, table}) => {
        const [isChecked, setIsChecked] = useState<boolean>(row.original.bookingStatus === "Picked Up");
  
        const handlePickUp = async () => {
          const success = await (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(
            row.original.containerID,
            "Picked Up",
            new Date().toLocaleDateString('en-US')
          );
          
          if (success) {
            setIsChecked((prev) => !prev);
          } else {
            console.error("Booking update failed. State not updated.");
          }
        };

        return (
          <Checkbox
            disabled={row.original.bookingStatus !== "Pending Pick Up"}
            checked={isChecked}
            onCheckedChange={handlePickUp}
          />
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      accessorKey: "modifyBooking",
      header: "Modify Booking",
      cell: ({ row, table }) => {
        const [date, setDate] = useState<Date | undefined>(undefined)
        const [time, setTime] = useState<string | undefined>(undefined)
        const [isCalendarOpen, setIsCalendarOpen] = useState(false)
        const [isDialogOpen, setIsDialogOpen] = useState(false)
        
        const isDateTimeSelected = (): boolean => {
          return !!date && !!time
        }
        
        const handleBooking = () => {
          (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(row.original.containerID, "Pickup Modification Requested", String(format(date!, "MM/dd/yyyy")), time ?? "")
          setIsDialogOpen(false)
        }

        const timeOptions = [
          "12:00 AM",
          "01:00 AM",
          "02:00 AM",
          "03:00 AM",
          "04:00 AM",
          "05:00 AM",
          "06:00 AM",
          "07:00 AM",
          "08:00 AM",
          "09:00 AM",
          "10:00 AM",
          "11:00 AM",
          "12:00 PM",
          "01:00 PM",
          "02:00 PM",
          "03:00 PM",
          "04:00 PM",
          "05:00 PM",
          "06:00 PM",
          "07:00 PM",
          "08:00 PM",
          "09:00 PM",
          "10:00 PM",
          "11:00 PM",
        ]

        const handleDateSelect = (selectedDate: Date | undefined) => {
          setDate(selectedDate)
          // Keep the calendar open after selection
          setIsCalendarOpen(true)
        }

        return (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="p-2" onClick={() => setIsDialogOpen(true)} disabled={row.original.bookingStatus !== "Pending Pick Up"}>
              <Pencil />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modify Container Pick-Up Booking</DialogTitle>
              <div className="text-sm">
                {`Original Booking: ${row.original.bookingDate} at  ${row.original.bookingTime}`}
              </div>
              <div className="text-sm text-muted-foreground">
                {`Vessel ID: ${row.original.vesselID} | Container ID: ${row.original.containerID} | Origin: ${row.original.origin} | BCO: ${row.original.bcoName} | BCO Email: ${row.original.bcoEmail}`}
              </div>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <CalendarIcon className="h-4 w-4" />
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                      onClick={() => setIsCalendarOpen(true)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "MM/dd/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} disabled={{ before: new Date()}} onSelect={handleDateSelect} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Clock className="h-4 w-4" />
                <Select onValueChange={setTime}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((timeOption) => (
                      <SelectItem key={timeOption} value={timeOption}>
                        {timeOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {isDateTimeSelected()
                  ? `Selected: ${format(date!, "MM/dd/yyyy")} ${time}`
                  : "Please select both date and time"}
              </div>
              <Button 
                type="submit" 
                disabled={!date || !time} 
                variant={!date || !time ? "outline" : "default"}
                onClick={handleBooking}
              >
                Modify
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )
      },
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
  baseColumns1.push({
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
return baseColumns1;
};








