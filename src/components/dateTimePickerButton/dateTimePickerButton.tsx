"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface DateTimePickerButtonProps {
    vesselID: string;
    containerID: string;
    origin: string;
    bcoName: string;
    bcoEmail: string;
}

export const DateTimePickerButton: React.FC<DateTimePickerButtonProps> = ({ vesselID, containerID, origin, bcoName, bcoEmail }) => {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState<string | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const isDateTimeSelected = (): boolean => {
    return !!date && !!time
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Book</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Container Pick-Up</DialogTitle>
          <div className="text-sm text-muted-foreground">
            {`Vessel ID: ${vesselID} | Container ID: ${containerID} | Origin: ${origin} | BCO: ${bcoName} | BCO Email: ${bcoEmail}`}
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
                <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />
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
          <Button type="submit" disabled={!date || !time} variant={!date || !time ? "outline" : "default"}>
            Book
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

