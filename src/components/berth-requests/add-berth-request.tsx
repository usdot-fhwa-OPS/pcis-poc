import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { CalendarIcon, CheckCircle2, Info, Upload } from "lucide-react";
import { FileUploader } from '@aws-amplify/ui-react-storage';
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../lib/utils";
import { format } from "date-fns";
import { useAppDispatch } from "../../hooks";
import { berthConfigList } from "./berth-request-client";
import { populate } from '../../components/berth-requests/berth-config-state';
import { BerthConfigDomain } from "./berth-config-domain";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";

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
    cargoManifestPath: string;
    vesselId: string;
}

const ALL_SERVICES = ["Fuel", "Food", "Water", "Crew Services", "Waste Disposal"];

interface AddBerthRequestProps {
    onDataChange?: (data: BerthRequestFormData) => void;
    onManifestChange?: (fileName: string, path: string) => void;
}

export const AddBerthRequest = ({ onDataChange, onManifestChange }: AddBerthRequestProps) => {

      const raw = sessionStorage.getItem('berthRequestDraft');
      const formDataRef = useRef<BerthRequestFormData | null>(raw ? JSON.parse(raw) : null);
    

    const [selectedTerminalId, setSelectedTerminalId] = useState<string>("")
    const [startDate, setStartDate] = useState<Date>(new Date())
    const [endDate, setEndDate] = useState<Date>(new Date())
     const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false)
     const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false)
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedCargoManifestPath, setSelectedCargoManifestPath] = useState<string>('')
    const [manifestFileName, setManifestFileName] = useState<string>('')
    const [vesselId, setVesselId] = useState<string>("")

    const timeOptions = [
        "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM",
        "04:00 AM", "05:00 AM", "06:00 AM", "07:00 AM",
        "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
        "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
        "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
        "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM",
    ]
    const [startTime, setStartTime] = useState<string>(timeOptions[0])
    const [endTime, setEndTime] = useState<string>(timeOptions[0])

    const toggleService = (service: string) => {
        setSelectedServices(prev =>
            prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
        );
    };

    const [TERMINALS, setTerminals] = useState<Record<string, { name: string; phone: string; email: string }>>({});

    useEffect(() => {
        if (!onDataChange) return;
        fetchBerthConfigList().then(() => {
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
                cargoManifestName: manifestFileName,
                cargoManifestPath: selectedCargoManifestPath,
                vesselId: vesselId,
            });

            if (formDataRef.current) {
                setSelectedTerminalId(formDataRef.current.terminalId || "")
                setStartDate(formDataRef.current?.startDate || new Date())
                setEndDate(formDataRef.current?.endDate || new Date())
                setSelectedServices(formDataRef.current?.services || [])
                setSelectedCargoManifestPath(formDataRef.current?.cargoManifestPath || '')
                setManifestFileName(formDataRef.current?.cargoManifestName || '')
                formDataRef.current = null;

            }

        })

        
    }, [selectedTerminalId, startDate, startTime, endDate, endTime, selectedServices, selectedCargoManifestPath]);

    const getFileInfo = ($event: any) => {
        const key = $event.key;
        setSelectedCargoManifestPath(key);
        const name = key.split('/').pop() || key;
        setManifestFileName(name);
        onManifestChange?.(name, key);
    };

    const handleStartDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;
        setStartDate(selectedDate)
        setIsStartCalendarOpen(!isStartCalendarOpen)
    };

    const handleEndDateSelect = (selectedDate: Date | undefined) => {
        if (!selectedDate) return;
        setEndDate(selectedDate)
        setIsEndCalendarOpen(!isEndCalendarOpen)
    };

    const dispatch = useAppDispatch();
    const fetchBerthConfigList = async () => {
        const brConfigList = await berthConfigList();
        const terminal: Record<string, { name: string; phone: string; email: string }> = {};
        brConfigList.map((berthConfig: BerthConfigDomain) => {
            terminal[berthConfig.terminalId] = {
                name: berthConfig.terminalName,
                phone: berthConfig.terminalPhone,
                email: berthConfig.terminalEmail,
            }
        });
        setTerminals(terminal);
        dispatch(populate(brConfigList));
    }
   

    return (
        <div className="border border-gray-200 rounded-xl bg-white p-6 md:p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Berth Request Details</h2>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Left column — form fields */}
                <div className="flex-1 space-y-5">
                    {/* Vessel Name */}
                    <div>
                        <Label className="text-xs font-medium text-gray-500 mb-2 block">Vessel Name</Label>
                        <Input
                            id="vesselID"
                            type="text"
                            disabled={true}
                            placeholder="Enter vessel name"
                            onChange={(e) => setVesselId(e.target.value)}
                            className="bg-gray-50 border-gray-200 h-10"
                        />
                    </div>

                    {/* Requested Terminal */}
                    <div>
                        <Label className="text-xs font-medium text-gray-500 mb-2 block">Requested Terminal</Label>
                        <Select onValueChange={setSelectedTerminalId} value={selectedTerminalId}>
                            <SelectTrigger className="bg-white border-gray-200 h-10">
                                <SelectValue placeholder="Select a terminal" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(TERMINALS).map(([id, t]) => (
                                    <SelectItem key={id} value={id}>{t.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Terminal contact info */}
                    {selectedTerminalId && (
                        <div className="text-sm text-muted-foreground">
                            <div className="flex items-center">
                                <Info className="inline-block h-4 w-4 mr-1" stroke="#0090FF" />
                                <p>To contact this terminal directly:</p>
                            </div>
                            <div className="px-8 py-1">
                                <p>{TERMINALS[selectedTerminalId].name}</p>
                                <p>Phone: <a href={`tel:${TERMINALS[selectedTerminalId].phone}`} className="text-blue-500 hover:underline">{TERMINALS[selectedTerminalId].phone}</a></p>
                                <p>Email: <a href={`mailto:${TERMINALS[selectedTerminalId].email}`} className="text-blue-500 hover:underline">{TERMINALS[selectedTerminalId].email}</a></p>
                            </div>
                        </div>
                    )}

                    {/* Estimated Arrival */}
                    <div>
                        <Label className="text-xs font-medium text-gray-500 mb-2 block">Estimated Arrival</Label>
                        <div className="flex items-center gap-2">
                            {showStartDateCalendar()}
                            {showStartTime()}
                        </div>
                    </div>

                    {/* Estimated Departure */}
                    <div>
                        <Label className="text-xs font-medium text-gray-500 mb-2 block">Estimated Departure</Label>
                        <div className="flex items-center gap-2">
                            {showEndDateCalendar()}
                            {showEndTime()}
                        </div>
                    </div>

                    {/* Manifest File */}
                    <div>
                        <Label className="text-xs font-medium text-gray-500 mb-2 block">Manifest File</Label>
                        {manifestFileName ? (
                            <div className="space-y-1.5">
                                <div className="bg-gray-50 border border-gray-200 rounded-md h-10 px-3 flex items-center gap-2 text-sm text-gray-700">
                                    <span className="flex-1 truncate">{manifestFileName} — uploaded</span>
                                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setManifestFileName(''); setSelectedCargoManifestPath(''); onManifestChange?.('', ''); }}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                    Change file
                                </button>
                            </div>
                        ) : (
                            <div className="border border-dashed border-gray-300 rounded-md bg-gray-50 p-3">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <Upload className="h-4 w-4" />
                                    <span>Upload a cargo manifest (.csv)</span>
                                </div>
                                <FileUploader
                                    acceptedFileTypes={['.csv']}
                                    path="stowPlans/berthRequest/"
                                    maxFileCount={1}
                                    isResumable
                                    onUploadSuccess={($event) => getFileInfo($event)}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right column — Additional Services */}
                <div className="md:w-52 shrink-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Services</h3>
                    <div className="flex flex-wrap md:flex-col gap-2">
                        {ALL_SERVICES.map((service) => (
                            <button
                                key={service}
                                type="button"
                                onClick={() => toggleService(service)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium border transition-colors text-left",
                                    selectedServices.includes(service)
                                        ? "bg-gray-900 text-white border-gray-900"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                )}
                            >
                                {service}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )

    function showStartTime() {
        return <Select onValueChange={setStartTime}>
            <SelectTrigger className={cn("w-[110px] bg-white border-gray-200 h-10")}>
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
                    className={cn("w-[160px] justify-start text-left font-normal bg-white border-gray-200 h-10", !startDate && "text-muted-foreground")}
                    onClick={() => setIsStartCalendarOpen(true)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MM/dd/yyyy") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <ScrollArea className="h-56 w-auto p-1">
                    <Calendar mode="single" selected={startDate} disabled={{ before: new Date() }} onSelect={handleStartDateSelect} initialFocus />
                </ScrollArea>
            </PopoverContent>
        </Popover>;
    }

    function showEndTime() {
        return <Select onValueChange={setEndTime}>
            <SelectTrigger className={cn("w-[110px] bg-white border-gray-200 h-10")}>
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
                    className={cn("w-[160px] justify-start text-left font-normal bg-white border-gray-200 h-10", !endDate && "text-muted-foreground")}
                    onClick={() => setIsEndCalendarOpen(true)}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MM/dd/yyyy") : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <ScrollArea className="h-56 w-auto p-1">
                    <Calendar mode="single" selected={endDate} disabled={{ before: new Date() }} onSelect={handleEndDateSelect} initialFocus />
                </ScrollArea>

            </PopoverContent>
        </Popover>;
    }
}
