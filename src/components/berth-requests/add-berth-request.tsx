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
import { useAppDispatch, useAppSelector } from "../../hooks";
import { berthConfigList } from "./berth-request-client";
import { getBerthConfigList, populate } from '../../components/berth-requests/berth-config-state';
import { BerthRequestDomain } from "./berth-request-domain";
import { events } from "aws-amplify/api";

export const AddBerthRequest = ({berthRequest}:{berthRequest:BerthRequestDomain}) => {

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

    const dispatch = useAppDispatch();
    const fetchBerthConfigList = async () => {

        dispatch(populate(await berthConfigList()));
    }
    const brConfig = useAppSelector(getBerthConfigList);
    

    useEffect(() => {
        fetchBerthConfigList();
        berthRequest.etaAt = format(startDate, "MM/dd/yyyy")+' '+startTime;
        berthRequest.etdAt = format(endDate, "MM/dd/yyyy")+' '+endTime;
    }, []);
  
    const handleTerminalSelection = (value: string) => {
        berthRequest.berthAssignment.berthId = value;
        berthRequest.berthAssignment.designation = value;
  };
    const handleServiceSelectionChange = (checked: string | boolean, value: string) => {

        if (checked === true) {

            berthRequest.services.push(value)

        } else if (checked === false){
            
            const index = berthRequest.services.indexOf(value);

            if (index > -1) {
                berthRequest.services.splice(index, 1);
            }

        }

    };

const getFileInfo = ($event) =>{
    berthRequest.manifestPath = $event.key;
}

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
                    <Select onValueChange={handleTerminalSelection}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                            <SelectContent>
                                {brConfig.berthDesignations.map((item) => {
                                    return (
                                        <SelectItem value={item}>
                                            {item}
                                        </SelectItem>
                                    )
                                })}


                            </SelectContent>
                    </Select>
                </div>
                <div className="md:col-start-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <Info className="inline-block h-4 w-4 mr-1" stroke="#0090FF" /><p>To contact this terminal directly:</p>
                    </div>
                    <div className="px-8 py-2">
                        <p>Terminal Name</p>
                        <p>Phone: <a href="tel:5555555555" className="text-blue-500 hover:underline">555-555-5555</a></p>
                        <p>Email: <a href="mailto:name@company.com" className="text-blue-500 hover:underline">name@company.com</a></p>
                    </div>
                </div>
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
                    <div className="flex items-center py-2 pr-4">
                        <Checkbox className="mr-2" id="berthRequestServicesFuel" value="Fuel"
                        onCheckedChange={(checked) => handleServiceSelectionChange(checked, 'Fuel')} />
                        <Label htmlFor="berthRequestServicesFuel">
                            Fuel
                        </Label>
                    </div>
                    <div className="flex items-center py-2 pr-4">
                        <Checkbox className="mr-2" id="berthRequestServicesFood" value="Food"
                        onCheckedChange={(checked) => handleServiceSelectionChange(checked, 'Food')}/>
                        <Label htmlFor="berthRequestServicesFood">
                            Food
                        </Label>
                    </div>
                    <div className="flex items-center py-2 pr-4">
                        <Checkbox className="mr-2" id="berthRequestServicesWater" value="Water"
                        onCheckedChange={(checked) => handleServiceSelectionChange(checked, 'Water')}/>
                        <Label htmlFor="berthRequestServicesWater">
                            Water
                        </Label>
                    </div>
                    <div className="flex items-center py-2 pr-4">
                        <Checkbox className="mr-2" id="berthRequestServicesCrew" value="Crew Services"
                        onCheckedChange={(checked) => handleServiceSelectionChange(checked, 'Crew Services')}/>
                        <Label htmlFor="berthRequestServicesCrew">
                            Crew Services
                        </Label>
                    </div>
                    <div className="flex items-center py-2">
                        <Checkbox className="mr-2" id="berthRequestServicesWaste" value="Waste Disposal"
                        onCheckedChange={(checked) => handleServiceSelectionChange(checked, 'Waste Disposal')}/>
                        <Label htmlFor="berthRequestServicesWaste">
                            Waste Disposal
                        </Label>
                    </div>
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
                        onUploadSuccess={($event) => getFileInfo($event)}
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
