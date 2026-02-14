import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../lib/utils";
import { format } from "date-fns"

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export const AddTerminalCapacity = () => {

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [terminalCapacity, setTerminalCapacity] = useState(0) 
    const handleOpen = async () => {
              setIsDialogOpen(true)
            }

    const [date, setDate] = useState<Date | undefined>(new Date())       
    const [time, setTime] = useState<string | undefined>(undefined)
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)
    
    const [repeatOption, setRepeatOption] = useState<string | undefined>(undefined)
    const [reason, setReason] = useState<string | undefined>(undefined)
    
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

        const repeatOptionList = [
            "Never", 
            "Daily",
            "Weekly",
            "Monthly",
            "Yearly",
            "Custom"
        ]

        const reasonList = [
                "Maintenance",
                "Equipment malfunction",
                "Labor shortage",
                "Other"
        ]

        const handleDateSelect = (selectedDate: Date | undefined) => {
          if (!selectedDate) return;
          setDate(selectedDate)
          // Keep the calendar open after selection
          setIsCalendarOpen(!isCalendarOpen)
        };
    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
                setIsDialogOpen(open)

            }}
        >
            <DialogTrigger asChild>
                <TooltipProvider>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger>
                            <div>
                              <Button onClick={handleOpen} >Add Terminal Capacity</Button>

                            </div>
                        </TooltipTrigger>

                    </Tooltip>
                </TooltipProvider>
            </DialogTrigger>
            <DialogContent className="DialogContent">
                <div className="grid grid-cols-5 gap-2">
                    <div className="h-10 col-span-3 col-start-1 ...">
                        <DialogHeader>
                            <DialogTitle>Add Temporrary Capicity</DialogTitle>
                            <DialogDescription></DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="col-start-1 col-end-2 ...">
                            <Label htmlFor="terminalCapacity" className="text-right">
                                Terminal Capacity
                            </Label>
                   </div>
                    <div className="col-3">
                        <Input
                            id="terminalCapacity"
                            type="number"
                            value={terminalCapacity}
                            onChange={(e) => setTerminalCapacity(Number(e.target.value))}
                            className="col-span-1"
                            min="0"
                            step="1"
                        />
                    </div>
                    <div className="col-start-3 col-end-6 ...">
                                            <Label htmlFor="terminalCapacity" className="text-left">
                                                reservation per day
                                            </Label>
                    </div>                        
  <div className="col-1">
    <Label htmlFor="terminalCapacity" className="text-right">
                            Start
                        </Label>
  </div>
  
  <div className="col-span-2 col-end-4 ...">
            <Popover modal={true} open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-[200px] justify-start text-left font-normal", !date && "text-muted-foreground",  )}
                        onClick={() => setIsCalendarOpen(true)}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "MM/dd/yyyy") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} disabled={{ before: new Date() }} onSelect={handleDateSelect} initialFocus />
                </PopoverContent>
            </Popover>

  </div>
  <div className="col-start-4 col-end-6 ...">
                            <Select onValueChange={setTime}>
                                <SelectTrigger className={cn("w-[150px]", )}>
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
  <div className="col-1">
    <Label htmlFor="terminalCapacity" className="text-right">
                            End
                        </Label>
  </div>
  
  <div className="col-span-2 col-end-4 ...">
            <Popover modal={true} open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn("w-[200px] justify-start text-left font-normal", !date && "text-muted-foreground", )}
                        onClick={() => setIsCalendarOpen(true)}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "MM/dd/yyyy") : <span>Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} disabled={{ before: new Date() }} onSelect={handleDateSelect} initialFocus />
                </PopoverContent>
            </Popover>

  </div>
  <div className="col-start-4 col-end-6 ...">
                            <Select onValueChange={setTime}>
                                <SelectTrigger className={cn("w-[150px]", )}>
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
  <div className="col-start-1 col-end-2 ...">Repeat</div>
  <div className="col-start-2 col-end-5 ...">
            <Select onValueChange={setRepeatOption}>
                <SelectTrigger className={cn("w-[150px]", )}>
                    <SelectValue placeholder="Never" />
                </SelectTrigger>
                <SelectContent>
                    {repeatOptionList.map((repeatOption) => (
                        <SelectItem key={repeatOption} value={repeatOption}>
                            {repeatOption}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

  </div>
<div className="col-start-1 col-end-2 ...">Reason</div>
  <div className="col-start-2 col-end-5 ...">
            <Select onValueChange={setReason}>
                <SelectTrigger className={cn("w-[150px]", )}>
                    <SelectValue placeholder="Maintenance" />
                </SelectTrigger>
                <SelectContent>
                    {reasonList.map((reason) => (
                        <SelectItem key={reason} value={reason}>
                            {reason}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

  </div>
  </div>
                          

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Add Another
                    </Button>
                    <Button onClick={() => { }}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    );
}