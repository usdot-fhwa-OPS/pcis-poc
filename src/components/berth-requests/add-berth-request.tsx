import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { CalendarIcon, Info } from "lucide-react";
import { Checkbox } from "../ui/checkbox";
import { FileUploader } from '@aws-amplify/ui-react-storage';
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../lib/utils";
import { format } from "date-fns";

export interface BerthRequestFormData {
    terminalId: string;
    terminalName: string;
    terminalPhone: string;
    terminalEmail: string;
    startDate: Date;
    startTime: string;
    endDate: Date;
    endTime: string;
    services: string[];
    cargoManifestName?: string;
}

const TERMINALS: Record<string, { name: string; phone: string; email: string }> = {
    "terminal-1": { name: "Port City Terminal", phone: "322-555-2368", email: "cmartinez@cityport.com" },
    "terminal-2": { name: "Harbor Terminal", phone: "555-867-5309", email: "info@harborterminal.com" },
}

const ALL_SERVICES = ["Fuel", "Food", "Water", "Crew Services", "Waste Disposal"];

interface AddBerthRequestProps {
    onDataChange?: (data: BerthRequestFormData) => void;
}

export const AddBerthRequest = ({ onDataChange }: AddBerthRequestProps) => {

    const [selectedTerminalId, setSelectedTerminalId] = useState<string>("")
    const [startDate, setStartDate] = useState<Date>(new Date())
    const [endDate, setEndDate] = useState<Date>(new Date())
    const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
    const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false)
    const [selectedServices, setSelectedServices] = useState<string[]>([])

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
    const [startTime, setStartTime] = useState<string>(timeOptions[0])
    const [endTime, setEndTime] = useState<string>(timeOptions[0])

    const toggleService = (service: string, checked: boolean) => {
        setSelectedServices(prev =>
            checked ? [...prev, service] : prev.filter(s => s !== service)
        );
    };

    useEffect(() => {
        if (!onDataChange) return;
        const terminal = TERMINALS[selectedTerminalId];
        onDataChange({
            terminalId: selectedTerminalId,
            terminalName: terminal?.name ?? "",
            terminalPhone: terminal?.phone ?? "",
            terminalEmail: terminal?.email ?? "",
            startDate,
            startTime,
            endDate,
            endTime,
            services: selectedServices,
        });
    }, [selectedTerminalId, startDate, startTime, endDate, endTime, selectedServices]);

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
        <div className="md:max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-[max-content_1fr] gap-2 md:items-center">
                <div className="pr-8">
                    <Label htmlFor="berthRequestTerminal">
                        Terminal
                    </Label>
                </div>
                <div className="pb-4 md:py-2">
                    <Select onValueChange={setSelectedTerminalId}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(TERMINALS).map(([id, t]) => (
                                <SelectItem key={id} value={id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {selectedTerminalId && (
                    <div className="md:col-start-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <Info className="inline-block h-4 w-4 mr-1" stroke="#0090FF" /><p>To contact this terminal directly:</p>
                        </div>
                        <div className="px-8 py-2">
                            <p>{TERMINALS[selectedTerminalId].name}</p>
                            <p>Phone: <a href={`tel:${TERMINALS[selectedTerminalId].phone}`} className="text-blue-500 hover:underline">{TERMINALS[selectedTerminalId].phone}</a></p>
                            <p>Email: <a href={`mailto:${TERMINALS[selectedTerminalId].email}`} className="text-blue-500 hover:underline">{TERMINALS[selectedTerminalId].email}</a></p>
                        </div>
                    </div>
                )}
                <div className="pr-8">
                    <Label htmlFor="berthRequestEta">
                        Estimated Arrival
                    </Label>
                </div>
                <div className="pb-4 md:py-2 flex items-center space-x-4">
                    {showStartDateCalendar()}
                    {showStartTime()}
                </div>
                <div className="pr-8">
                    <Label htmlFor="berthRequestEtd">
                        Estimated Departure
                    </Label>
                </div>
                <div className="pb-4 md:py-2 flex items-center space-x-4">
                    {showEndDateCalendar()}
                    {showEndTime()}
                </div>
                <div className="md:self-start md:pt-1 pr-8">
                    <span className="text-sm font-medium leading-none">Services Required</span>
                </div>
                <div className="flex flex-wrap">
                    {ALL_SERVICES.map((service) => (
                        <div key={service} className="flex items-center py-2 pr-4">
                            <Checkbox
                                className="mr-2"
                                id={`berthRequestServices${service.replace(/\s/g, "")}`}
                                checked={selectedServices.includes(service)}
                                onCheckedChange={(checked) => toggleService(service, !!checked)}
                            />
                            <Label htmlFor={`berthRequestServices${service.replace(/\s/g, "")}`}>
                                {service}
                            </Label>
                        </div>
                    ))}
                </div>
                <div className="md:col-span-2 mt-8 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Attach a Cargo Manifest</h2>
                    <p className="mb-3">Instructions for file attachment:</p>
                    <ol className="list-decimal list-outside pl-6 space-y-4">
                        <li>Locate your cargo manifest file on your computer. <span className="text-sm text-muted-foreground">(Supported file formats: .csv, .xls, .txt)</span></li>
                        <li>Drag and drop the file into the upload area below or select &ldquo;Browse Files&rdquo; to find it.</li>
                        <li>A check mark will appear next to your file&rsquo;s name when it is uploaded.</li>
                    </ol>
                </div>
                <div className="md:col-span-2 mb-8">
                    <FileUploader
                        acceptedFileTypes={[
                        '.csv',
                        ]}
                        path="stowPlans/"
                        maxFileCount={1}
                        isResumable
                    />
                </div>
            </div>
        </div>
    </>
    )

    function showStartTime() {
        return <Select onValueChange={setStartTime}>
            <SelectTrigger className={cn("w-[110px]")}>
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
                    className={cn("w-[144px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
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
            <SelectTrigger className={cn("w-[110px]")}>
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
                    className={cn("w-[144px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
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
