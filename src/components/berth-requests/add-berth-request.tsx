import { useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { CalendarIcon, Info } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../lib/utils";
import { format } from "date-fns";

export const AddBerthRequest = () => {

    const [startDate, setStartDate] = useState<Date>(new Date())
    const [endDate, setEndDate] = useState<Date>(new Date())    
    const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
    const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false)

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
    const [startTime, setStartTime] = useState<string | undefined>(timeOptions[0])
    const [endTime, setEndTime] = useState<string | undefined>(timeOptions[0])
    
    const handleStartDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;
        setStartDate(selectedDate)
        // Keep the calendar open after selection
        setIsStartCalendarOpen(!isStartCalendarOpen)
    };

    const handleEndDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;
        setEndDate(selectedDate)
        // Keep the calendar open after selection
        setIsEndCalendarOpen(!isEndCalendarOpen)
    };

    return (
    <>
        <div className="max-w-2xl">
            <div className="grid grid-cols-5 gap-2 items-center">
                <div className="col-1">
                    <Label htmlFor="berthRequestTerminal">
                        Terminal
                    </Label>
                </div>
                <div className="col-start-2 col-end-6">
                    <Select>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Terminal Name 1">
                                Terminal Name 1
                            </SelectItem>
                            <SelectItem value="Terminal Name 2">
                                Terminal Name 2
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-start-2 col-end-6 pt-2">
                    <p className="mb-2"><Info className="h-4 w-4 mr-2" stroke="#0090FF" /> To contact this terminal directly:</p>
                    <div className="px-8 pb-3">
                        <p>Terminal Name</p>
                        <p>Phone: <a href="tel:5555555555">555-555-5555</a></p>
                        <p>Email: <a href="mailto:name@company.com">name@company.com</a></p>
                    </div>
                </div>
                <div className="col-1">
                    <Label htmlFor="berthRequestEta">
                        Estimated Arrival
                    </Label>
                </div>
                <div className="col-span-2 col-end-4">
                    {showStartDateCalendar()}
                </div>
                <div className="col-start-4 col-end-6">
                    {showStartTime()}
                </div>
                <div className="col-1">
                    <Label htmlFor="berthRequestEtd">
                        Estimated Departure
                    </Label>
                </div>
                <div className="col-span-2 col-end-4">
                    {showEndDateCalendar()}
                </div>
                <div className="col-start-4 col-end-6">
                    {showEndTime()}
                </div>
                <div className="col-1">
                    <span className="text-sm font-medium leading-none">Services Required</span>
                </div>
                <div className="col-start-2 col-end-6">
                    <Checkbox id="berthRequestServicesFuel" value="Fuel"/>
                    <Label htmlFor="berthRequestServicesFuel">
                        Fuel
                    </Label>
                    <Checkbox id="berthRequestServicesFood" value="Food"/>
                    <Label htmlFor="berthRequestServicesFood">
                        Food
                    </Label>
                    <Checkbox id="berthRequestServicesWater" value="Water"/>
                    <Label htmlFor="berthRequestServicesWater">
                        Water
                    </Label>
                    <Checkbox id="berthRequestServicesCrew" value="Crew Services"/>
                    <Label htmlFor="berthRequestServicesCrew">
                        Crew Services
                    </Label>
                    <Checkbox id="berthRequestServicesWaste" value="Waste Disposal"/>
                    <Label htmlFor="berthRequestServicesWaste">
                        Waste Disposal
                    </Label>
                </div>
                <div className="col-span-5 mt-8 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Attach a Cargo Manifest</h2>
                    <p className="mb-3">Instructions for file attachment:</p>
                    <ol className="space-y-4 list-decimal list-inside">
                        <li>Locate your cargo manifest file on your computer.</li>
                        <li>Drag and drop the file into the upload area below or select &ldquo;Browse Files&rdquo; to find it.</li>
                        <li>A check mark will appear next to your file&rsquo;s name when it is uploaded.</li>
                    </ol>
                </div>
                <div className="col-span-5 mb-6">
                    File upload area
                </div>
            </div>
        </div>
    </>
    )

    function showStartTime() {
        return <Select onValueChange={setStartTime}>
            <SelectTrigger className={cn("w-[150px]")}>
                <SelectValue placeholder={startTime} />
            </SelectTrigger>
            <SelectContent>
                {timeOptions.map((timeOption) => (
                    <SelectItem key={timeOption} value={timeOption}>
                        {timeOption}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>;
    }

    function showStartDateCalendar() {
        return <Popover modal={true} open={isStartCalendarOpen} onOpenChange={setIsStartCalendarOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn("w-[200px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                    onClick={() => setIsStartCalendarOpen(true)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MM/dd/yyyy") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} disabled={{ before: new Date() }} onSelect={handleStartDateSelect} initialFocus />
            </PopoverContent>
        </Popover>;
    }

    function showEndTime() {
        return <Select onValueChange={setEndTime}>
            <SelectTrigger className={cn("w-[150px]")}>
                <SelectValue placeholder={endTime} />
            </SelectTrigger>
            <SelectContent>
                {timeOptions.map((timeOption) => (
                    <SelectItem key={timeOption} value={timeOption}>
                        {timeOption}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>;
    }

    function showEndDateCalendar() {
        return <Popover modal={true} open={isEndCalendarOpen} onOpenChange={setIsEndCalendarOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn("w-[200px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    onClick={() => setIsEndCalendarOpen(true)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MM/dd/yyyy") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} disabled={{ before: new Date() }} onSelect={handleEndDateSelect} initialFocus />
            </PopoverContent>
        </Popover>;
    }

}
