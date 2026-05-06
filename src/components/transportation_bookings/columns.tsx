import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "../ui/badge.tsx";
import { Button } from "../ui/button.tsx";
import { useState } from "react";
import { Flag, CalendarIcon, Clock, Pencil, ShieldHalf } from "lucide-react";
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
import { differenceInDays, format, isWeekend } from "date-fns"
import { cn } from "../../lib/utils"
import { TransOpUpcomingBookings, TransOpOngoingBookings } from "../../routes/reservation.tsx";
//Four Imports needed for Amplify Data Queries and CRUD methods

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { TransOpDataTableMeta } from "./data-table.tsx";

const client = generateClient<Schema>();
import { TransOperatorCompletedBookings } from "../../routes/reservation.tsx"
import { Checkbox } from "../ui/checkbox.tsx";
import { toast } from "sonner";
import { useAppDispatch } from "../../hooks.tsx";
import { populate } from "../terminal-capacity/terminal-capacity-state.tsx";
import { TerminalCapacityDomain } from "../terminal-capacity/terminal-capacity-domain.tsx";
import { terminalCapacityList } from "../terminal-capacity/terminal-capacity-client.tsx";


export const columns = (): ColumnDef<any>[] => {
  const baseColumns: ColumnDef<TransOpUpcomingBookings>[] = [

    {
      accessorKey: "vesselID",
      header: "Vessel ID",
    },
    {
      accessorKey: "cargoUnitID", 
      header: "Cargo Unit ID",
    },
    {
      accessorKey: "origin",
      header: "Origin",
    },
    {
      accessorKey: "bcoName",
      header: "BCO",
    },
    {
      accessorKey: "bcoEmail",
      header: "BCO Email",
    },
    {
      accessorKey: "transopName",
      header: "Transportation Coordinator",
    },
    {
      accessorKey: "transopEmail",
      header: "Transportation Coordinator Email",
    },
    { accessorKey: "assignmentDate", 
      header: "Assignment Date", },
    {
      accessorKey: "status",
      header: () => <div style={{ minWidth: "50px"}}>Status</div>,
      cell: ({ row, table }) => (
        <div className="flex space-x-8 ">
          <Button 
            variant="outline" 
            className="text-green-700"
            onClick={() => (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(row.original.cargoUnitID, "Pending Reservation")} 
          >
            Approve
          </Button>

          <Button 
            variant="destructive"
            onClick={() => (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(row.original.cargoUnitID, "unassigned")} 
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
            cargoUnitID: row.original.cargoUnitID, 
            flag: newFlag,
          })
          console.log("Updated container status:", updatedContainerStatus);
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
      header: "Vessel ID",
    },
    {
      accessorKey: "cargoUnitID", 
      header: "Cargo Unit ID",
    },
    {
      accessorKey: "origin",
      header: "Origin",
    },
    {
      accessorKey: "bcoName",
      header: "BCO",
    },
    {
      accessorKey: "bcoEmail",
      header: "BCO Email",
    },
    {
      accessorKey: "transopName",
      header: "Transportation Coordinator",
    },
    {
      accessorKey: "transopEmail",
      header: "Transportation Coordinator Email",
    },
    {
      accessorKey: "reservationDate",
      header: "Reservation Date",
    },
    {
      accessorKey: "reservationTime",
      header: "Reservation Time",
    },
    {
      accessorKey: "resApprovalDate",
      header: "Reservation Approval Date",
    },
    {
      accessorKey: "reservationStatus",
      header: () => (
        <div className="w-[150px] text-center">
          Reservation Status
        </div>
      ),
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
      accessorKey: "resPickupDate",
      header: "Reservation Pickup Date",
    },
  ];
  return baseColumns;
};

export const OngoingColumn = (): ColumnDef<any>[] => {
  const baseColumns1: ColumnDef<TransOpOngoingBookings>[] = [
    { accessorKey: "vesselID", header: "Vessel ID" },
    { accessorKey: "cargoUnitID", header: "Cargo Unit ID" }, 
    { accessorKey: "origin", header: "Origin" },
    { accessorKey: "bcoName", header: "BCO" },
    { accessorKey: "bcoEmail", header: "BCO Name" },
    { accessorKey: "transopName", header: "Transportation Coordinator" },
    { accessorKey: "transopEmail", header: "Transportation Coordinator Email" },
    { accessorKey: "reservationDate", header: "Date Initiated" },
    { accessorKey: "reservationTime", header: "Time Initiated" },
    {
      accessorKey: "status",
      header: () =><div className="w-[150px] text-center">
      Reservation Status
    </div>,
      cell: ({ row, table }) => {

        const [date, setDate] = useState<Date | undefined>(new Date())
        const [time, setTime] = useState<string | undefined>(undefined)
        const [isCalendarOpen, setIsCalendarOpen] = useState(false)
        const [isDialogOpen, setIsDialogOpen] = useState(false)
        const [isAtCapacity, setIsAtCapacity] = useState(false)
        const dispatch = useAppDispatch()   
        
        const isDateTimeSelected = (): boolean => {
          return !!date && !!time
        }
        
        async function getTerminalCapacityLimit(date: Date, time: string) {
          let limit = 0;
          try {

            const termCapList = await terminalCapacityList();
            dispatch(populate(termCapList));
            termCapList.map((item) => {
              try {
                if (item) {
                  if ('MAXIMUM' === item.capacityType) {

                    limit = limit + item.capacity;

                  } else if ((item.startDate) && (item.endDate)
                    && (item.startTime) && (item.endTime)) {

                    if ('Never' === item.repeat) {
                      if (differenceInDays(date, item.startDate) === 0) {
                        // same day as start date
                        addLimit(item);
                      }

                    } else if ('Daily' === item.repeat) {

                      addLimit(item);

                    } else if ('Weekdays' === item.repeat) {

                      if (!isWeekend(date)) {
                        addLimit(item);
                      }

                    } else if ('Weekends' === item.repeat) {

                      if (isWeekend(date)) {
                        addLimit(item);
                      }


                    } else if ('Weekly' === item.repeat) {

                      let daysAfterStart = differenceInDays(date, item.startDate);
                      if ((daysAfterStart % 7) == 0) {
                        addLimit(item);

                      }

                    } else if ('Biweekly' === item.repeat) {

                      let daysAfterStart = differenceInDays(date, item.startDate);
                      //even
                      if ((daysAfterStart % 2) == 0) {
                        // bi weekly
                        addLimit(item);

                      }

                    } else if ('Monthly' === item.repeat) {

                      let daysAfterStart = differenceInDays(date, item.startDate);

                      if ((daysAfterStart % 30) == 0) {

                        addLimit(item);

                      }

                    } else if ('Every 3 months' === item.repeat) {

                      let daysAfterStart = differenceInDays(date, item.startDate);

                      if ((daysAfterStart % (30 * 3)) == 0) {

                        addLimit(item);

                      }

                    } else if ('Every 6 months' === item.repeat) {

                      let daysAfterStart = differenceInDays(date, item.startDate);

                      if ((daysAfterStart % (30 * 6)) == 0) {

                        addLimit(item);

                      }

                    } else if ('Yearly' === item.repeat) {

                      let daysAfterStart = differenceInDays(date, item.startDate);

                      if ((daysAfterStart % 365) == 0) {

                        addLimit(item);

                      }

                    } else if ('Custom' === item.repeat) {

                      if ('Daily' === item.repeatConfig?.frequency) {

                        let daysCount = differenceInDays(date, item.startDate);
                        if ((item.repeatConfig.interval) &&
                          ((daysCount % item.repeatConfig.interval) == 0)) {

                          addLimit(item);
                        }

                      } else if ('Weekly' === item.repeatConfig?.frequency) {

                        let daysCount = differenceInDays(date, item.startDate);
                        if ((item.repeatConfig.interval) &&
                          ((daysCount % (item.repeatConfig.interval * 7)) == 0)) {

                          addLimit(item);
                        }

                      } else if ('Monthly' === item.repeatConfig?.frequency) {

                        let daysCount = differenceInDays(date, item.startDate);
                        if ((item.repeatConfig.interval) &&
                          ((daysCount % (item.repeatConfig.interval * 30)) == 0)) {

                          addLimit(item);
                        }

                      } else if ('Yearly' === item.repeatConfig?.frequency) {

                        let daysCount = differenceInDays(date, item.startDate);
                        if ((item.repeatConfig.interval) &&
                          ((daysCount % (item.repeatConfig.interval * 365)) == 0)) {

                          addLimit(item);
                        }

                      }

                    }


                  }
                }

              } catch (e) {
                console.error(e);
              }
            })




          } catch (error) {
            console.error('Error fetching booking limit', error);
          }
          return limit;

          function addLimit(item: TerminalCapacityDomain) {
            const start = new Date(item.startDate + ' ' + item.startTime);
            const end = new Date(item.endDate + ' ' + item.endTime);

            const pickedDate = new Date(format(date, "MM/dd/yyyy") + ' ' + time);
            if ((pickedDate >= start) && (pickedDate <= end)) {
              limit = limit + item.capacity;
            }
          }
        }

        const handleBooking = async () => {
          if (date && time) {
            const limit = await getTerminalCapacityLimit(date, time)
            const bookingsLength = await (table.options.meta as TransOpDataTableMeta)?.getBookingsAmount(String(format(date!, "MM/dd/yyyy")))
            if (bookingsLength >= limit) {
              setIsAtCapacity(true);
              toast.error(`Terminal at capacity (Limit ${limit} per day). Please try a different date.`)
            } else {
              (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(row.original.cargoUnitID, "Pending Reservation Approval", String(format(date!, "MM/dd/yyyy")), time ?? "")
              setIsDialogOpen(false)
              setIsAtCapacity(false)
            }
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
          if (!selectedDate) return;
          setDate(selectedDate)
          // Keep the calendar open after selection
          setIsCalendarOpen(true)
        };

        return (
             <div className="w-[150px] flex justify-center">
              {row.original.reservationStatus === "Pending Reservation" ? (
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open) => {
              setIsDialogOpen(open)
              if(!open) {
                setIsAtCapacity(false)
              }
            }}
          >
            <DialogTrigger>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger>
                  <Button variant="outline" onClick={() => setIsDialogOpen(true)} disabled={row.original.containerStatus === "On-Ship"}>Reserve</Button>
                </TooltipTrigger>
                {row.original.containerStatus === "On-Ship" && (
                  <TooltipContent>
                    <p>Cargo Unit still on ship. Cannot reserve.</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Reserve Cargo Unit Pick-Up</DialogTitle>
                <div className="text-sm text-muted-foreground">
                  
                  {`Vessel ID: ${row.original.vesselID} | Cargo Unit ID: ${row.original.cargoUnitID} | Origin: ${row.original.origin} | BCO: ${row.original.bcoName} | BCO Email: ${row.original.bcoEmail}`}  
                </div>
              </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <CalendarIcon className="h-4 w-4" />
                  <Popover modal={true} open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground", isAtCapacity && "border-red-500")}
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
                  <SelectTrigger className={cn("w-[280px]", isAtCapacity && "border-red-500")}>
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
                  Reserve
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <span
          className={`px-2 py-1 text-sm font-bold rounded-md bg-gray-300 text-center whitespace-normal break-words w-full ${
            row.original.reservationStatus === "Late for Pick Up" ? "text-red-600" : "text-black"
          }`}
        >
          {row.original.reservationStatus}
        </span>
        )
        }
        </div>
          );

          



          
      },
    
    },
    {
      id: "changepickupstatus",
      header: () => <div className="text-center">Mark as Picked Up</div>,
      cell: ({ row, table}) => {
        const [isChecked, setIsChecked] = useState<boolean>(row.original.reservationStatus === "Picked Up");
  
        const handlePickUp = async () => {
          const success = await (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(
            row.original.cargoUnitID, 
            "Picked Up",
            new Date().toLocaleDateString('en-US')
          );
          
          if (success) {
            setIsChecked((prev) => !prev);
          } else {
            console.error("Reservation update failed. State not updated.");
          }
        };

        return (
          <Checkbox
            disabled={row.original.reservationStatus !== "Pending Pick Up" && row.original.reservationStatus !== "Late for Pick Up"}
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
      header:()=><div className="text-center">Modify Reservation</div>,
      cell: ({ row, table }) => {
        const [date, setDate] = useState<Date | undefined>(new Date())
        const [time, setTime] = useState<string | undefined>(undefined)
        const [isCalendarOpen, setIsCalendarOpen] = useState(false)
        const [isDialogOpen, setIsDialogOpen] = useState(false)
        
        const isDateTimeSelected = (): boolean => {
          return !!date && !!time
        }

        const handleBooking = async () => {
          const limit = await (table.options.meta as TransOpDataTableMeta)?.getTerminalCapacity() 
          const bookingsLength = await (table.options.meta as TransOpDataTableMeta)?.getBookingsAmount(String(format(date!, "MM/dd/yyyy")))
          if (bookingsLength >= limit) {
            toast.error(`Terminal at capacity (Limit ${limit} per day). Please try a different date.`) 
          } else {
            (table.options.meta as TransOpDataTableMeta)?.updateTransOpBooking(row.original.cargoUnitID, "Pickup Modification Requested", String(format(date!, "MM/dd/yyyy")), time ?? "") 
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
          if (!selectedDate) return;
          setDate(selectedDate)
          // Keep the calendar open after selection
          setIsCalendarOpen(true)
        }

        return (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button variant="ghost" className="p-2" onClick={() => setIsDialogOpen(true)} disabled={row.original.reservationStatus !== "Pending Pick Up" && row.original.reservationStatus !== "Late for Pick Up"}>
              <Pencil />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modify Cargo Unit Pick-Up Reservation</DialogTitle>
              <div className="text-sm">
                {`Original Reservation: ${row.original.reservationDate} at  ${row.original.reservationTime}`}
              </div>
              <div className="text-sm text-muted-foreground">
                
                {`Vessel ID: ${row.original.vesselID} | Cargo Unit ID: ${row.original.cargoUnitID} | Origin: ${row.original.origin} | BCO: ${row.original.bcoName} | BCO Email: ${row.original.bcoEmail}`} 
              </div>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <CalendarIcon className="h-4 w-4" />
                <Popover modal={true} open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
      accessorKey: "twicEscortRequired",
      header: () => <abbr className="decoration-[1px] decoration-dotted underline-offset-4" title="Transportation Worker Identification Credential">TWIC</abbr>,
      cell: ({ row }) => {
        const required = row.original.twicEscortRequired; // Get TWIC value
        
        if (required === true) {
          return (
            <div className="min-w-[164px]">
              <Badge 
                className="border-amber-200 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100/80 gap-1"
              >
                <ShieldHalf fill="#fff" className="inline-block w-4 h-4" />
                TWIC Escort Required
              </Badge>
            </div>
          );
        }
      }
    },
    {
      accessorKey: "contact_bco",
      header:()=><div className="text-center">Contact BCO</div>,
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
    header: () => <div style={{ minWidth: "50x", textAlign: "center" }}>Flag</div>,
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
return baseColumns1;
};








