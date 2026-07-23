import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../lib/utils";
import { format } from "date-fns"

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { TerminalCapacityDomain } from "./terminal-capacity-domain";
import { saveTerminalCapacity, terminalCapacityList} from "./terminal-capacity-client";
import { DailyRepeatOptions } from "./DailyRepeatOptions";
import { WeeklyRepeatOptions } from "./WeeklyRepeatOptions";
import { MonthlyRepeatOptions } from "./MonthlyRepeatOptions";
import { YearlyRepeatOptions } from "./YearlyRepeatOptions.";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { getTerminalCapacityList, populate } from "./terminal-capacity-state";

export const UpdateTerminalCapacity = (terminalCapacityUid:string) => {

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [terminalCapacity, setTerminalCapacity] = useState(0) 
    const tcList = useAppSelector(getTerminalCapacityList)
    const dispatch = useAppDispatch()   
    
    
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

    
        const repeatOptionList = [
            "Never", 
            "Daily",
            "Weekdays",
            "Weekends",
            "Weekly",
            "Biweekly",
            "Monthly",
            "Every 3 months",
            "Every 6 months",
            "Yearly",
            "Custom"
        ]
        const [repeatOption, setRepeatOption] = useState<string | undefined>(repeatOptionList[0])

        const reasonList = [
                "Maintenance",
                "Equipment Malfunction",
                "Labor Shortage",
                "Other"
        ]

        const frequencyList = [
                "Daily",
                "Weekly",
                "Monthly",
                "Yearly"
        ]
        const [reason, setReason] = useState<string | undefined>(reasonList[0])
        const [otherReason, setOtherReason] = useState<string | undefined>('')

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

       const showOtherReason = (): boolean =>{

            return 'Other' === reason;
       }
        
    const showCustomRepeat = (): boolean =>{

            return 'Custom' === repeatOption;
       }
       const [frequency, setFrequency] = useState<string | undefined>(frequencyList[0])

       const showDailyRepeatOption = (): boolean =>{

            return 'Daily' === frequency;
       }
       const [dailyEvery, setDailyEvery] = useState<number | undefined>()
        
       
       const showWeeklyRepeatOption = (): boolean =>{

            return 'Weekly' === frequency;
       }
       const [weeklyEvery, setWeeklyEvery] = useState<number | undefined>()
       const [weeklyOnDays, setWeeklyOnDays] = React.useState<string[] | undefined>([])

       const showMonthlyRepeatOption = (): boolean =>{

            return 'Monthly' === frequency;
       }
        const showYearlyRepeatOption = (): boolean =>{

            return 'Yearly' === frequency;
       }

       const [monthlyEvery, setMonthlyEvery] = useState<number | undefined>()
       const [repeatCycle, setRepeatCycle] = React.useState<string | undefined>()
       const [daysOfMonth, setDaysOfMonth] = React.useState<string[] | undefined>([])
       const [onTheWeek, setOnTheWeek] = React.useState<string | undefined>()
       const [onTheWeekDay, setOnTheWeekDay] = React.useState<string | undefined>()
       
       const [yearlyEvery, setYearlyEvery] = useState<number | undefined>()
       const [monthsOfYear, setMonthsOfYear] = useState<string[] | undefined>()
       const [dayOfWeekforYearly, setDayOfWeekforYearly] = React.useState(false)

    const findTerminalCapacityDomain = () => {
        const respTc: TerminalCapacityDomain 
                = (tcList.filter(value => (value.capacityId === terminalCapacityUid)))[0];

            setTerminalCapacity(respTc.capacity);
            setStartDate(respTc.startDate ? new Date(respTc.startDate) : new Date());
            setStartTime(respTc.startTime ? respTc.startTime : undefined);
            setEndDate(respTc.endDate ? new Date(respTc.endDate) : new Date());
            setEndTime(respTc.endTime ? respTc.endTime : undefined);
            setRepeatOption(respTc.repeat);
            setReason(respTc.reason);
            setOtherReason(respTc.reason);
            if (('Custom' === respTc.repeat) && respTc.repeatConfig) {

                //setRepeatOption('Custom');
                const frequency = respTc.repeatConfig.frequency;
                setFrequency(frequency)
                if ('Daily' === frequency) {

                    setDailyEvery(respTc.repeatConfig.interval)

                } else if ('Weekly' === frequency) {

                    setWeeklyEvery(respTc.repeatConfig.interval);
                    setWeeklyOnDays(respTc.repeatConfig.daysOfWeek);


                } else if ('Monthly' === frequency) {

                    setMonthlyEvery(respTc.repeatConfig.interval)
                    setRepeatCycle(respTc.repeatConfig.cycle)
                    setDaysOfMonth(respTc.repeatConfig.daysOfMonth)
                    setOnTheWeek(respTc.repeatConfig.weekNumber)
                    setOnTheWeekDay(respTc.repeatConfig.dayOfWeek)


                } else if ('Yearly' === frequency) {

                    setYearlyEvery(respTc.repeatConfig.interval)
                    setMonthsOfYear(respTc.repeatConfig.months)
                    if (respTc.repeatConfig.daysOfWeek) {

                        setOnTheWeekDay(respTc.repeatConfig.dayOfWeek);
                        setDayOfWeekforYearly(true);

                    }

                    setOnTheWeek(respTc.repeatConfig.weekNumber)
                    setMonthsOfYear(respTc.repeatConfig.months)

                }

            }


    
    }
       
    
       
    const handleOpen = () => {
        findTerminalCapacityDomain();
        setIsDialogOpen(true)
    }


       const save = async () => {
       
               const termCapDomain: TerminalCapacityDomain = {
                   capacityId: terminalCapacityUid,
                   capacity: terminalCapacity,
                   capacityType: 'TEMPORARY',
                   createdAt: (new Date()).toISOString(),
                   updatedAt: (new Date()).toISOString(),
                   startDate: format(startDate, "MM/dd/yyyy"),
                   startTime: startTime,
                   endDate: format(endDate, "MM/dd/yyyy"),
                   endTime: endTime,
                   repeat: repeatOption,
                    reason: showOtherReason()?otherReason:reason,
                   isActive: true,
                    repeatConfig: {
                           frequency: frequency,         // "daily" | "weekly" | "monthly" | "yearly"
                           interval: dailyEvery?dailyEvery:(weeklyEvery?weeklyEvery:
                               (monthlyEvery?monthlyEvery:
                               yearlyEvery?yearlyEvery:undefined)),          // Every X days/weeks/months/years
                           
                           // Weekly specific
                           daysOfWeek: weeklyOnDays,      // ["monday", "wednesday"]
                           
                           // Monthly specific
                            cycle: repeatCycle,             // "each" | "onThe"
                            daysOfMonth: daysOfMonth,     // [10, 27] when cycle = "each"
                            weekNumber: onTheWeek,        // "first" | "second" | "third" | "fourth" | "last"
                            dayOfWeek: onTheWeekDay,         // "monday" through "sunday"
                           
                           // // Yearly specific
                            months: monthsOfYear,          // ["june", "december"]
                           // Can also use weekNumber + dayOfWeek for yearly
                   }
       
               };
       
               saveTerminalCapacity(termCapDomain).then(async (resp) => { 
                console.log(resp) 
                 dispatch(populate(await terminalCapacityList()));
            });
               setIsDialogOpen(false);
           }


  
    return (
            <>
             <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open)
                }}
            >
                <DialogTrigger render={
                    <Button
                              size="sm"
                              variant="link"
                              className="text-blue-600 p-0 h-auto"
                              onClick={handleOpen}
                            >
                              Modify
                    </Button>
                } />
                <DialogContent className="DialogContent flex flex-col" style={{maxHeight: '90vh'}}>
                    <div className="overflow-y-auto flex-1 min-h-0">
                            <div className="space-y-4">
                                <div className="grid grid-cols-5 gap-y-4 gap-x-2">
                                    <div className="h-10 col-span-3 col-start-1 ...">
                                        <DialogHeader>
                                            <DialogTitle>Edit Temporary Capacity</DialogTitle>
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
                                            reservation(s) per day
                                        </Label>
                                    </div>
                                    <div className="col-1">
                                        <Label htmlFor="terminalCapacity" className="text-right">Start</Label>
                                    </div>

                                    <div className="col-span-2 col-end-4 ...">{showStartDateCalendar()}</div>
                                    <div className="col-start-4 col-end-6 ...">{showStartTime()}</div>
                                    <div className="col-1">
                                        <Label htmlFor="terminalCapacity" className="text-right">End</Label>
                                    </div>

                                    <div className="col-span-2 col-end-4 ...">
                                        {showEndDateCalendar()}

                                    </div>
                                    <div className="col-start-4 col-end-6 ...">
                                        {showEndTime()}

                                    </div>
                                    <div className="col-start-1 col-end-2 ...">Repeat</div>
                                    <div className="col-start-2 col-end-5 ...">
                                        <Select onValueChange={setRepeatOption}>
                                            <SelectTrigger className={cn("w-[150px]",)}>
                                                <SelectValue placeholder={repeatOption} />
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
                                    {showCustomRepeat() &&
                                        <>
                                            <div className="col-start-1 col-end-2 ...">Frequency</div>
                                            <div className="col-start-2 col-end-5 ...">
                                                <Select onValueChange={setFrequency}>
                                                    <SelectTrigger className={cn("w-[150px]",)}>
                                                        <SelectValue placeholder={frequency} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {frequencyList.map((frequency) => (
                                                            <SelectItem key={frequency} value={frequency}>
                                                                {frequency}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                            </div>
                                            {showDailyRepeatOption() &&
                                                <DailyRepeatOptions
                                                    dailyEvery={dailyEvery}
                                                    setDailyEvery={setDailyEvery} />
                                            }

                                            {showWeeklyRepeatOption() &&

                                                <WeeklyRepeatOptions
                                                    weeklyEvery={weeklyEvery}
                                                    setWeeklyEvery={setWeeklyEvery}
                                                    weeklyOnDays={weeklyOnDays}
                                                    setWeeklyOnDays={setWeeklyOnDays}></WeeklyRepeatOptions>
                                            }

                                            {showMonthlyRepeatOption() &&

                                                <MonthlyRepeatOptions
                                                    monthlyEvery={monthlyEvery}
                                                    setMonthlyEvery={setMonthlyEvery}
                                                    repeatCycle={repeatCycle}
                                                    setRepeatCycle={setRepeatCycle}
                                                    daysOfMonth={daysOfMonth}
                                                    setDaysOfMonth={setDaysOfMonth}
                                                    onTheWeek={onTheWeek}
                                                    setOnTheWeek={setOnTheWeek}
                                                    onTheWeekDay={onTheWeekDay}
                                                    setOnTheWeekDay={setOnTheWeekDay} />

                                            }
                                            {showYearlyRepeatOption() &&

                                                <YearlyRepeatOptions
                                                    yearlyEvery={yearlyEvery}
                                                    setYearlyEvery={setYearlyEvery}
                                                    monthsOfYear={monthsOfYear}
                                                    setMonthsOfYear={setMonthsOfYear}
                                                    dayOfWeekforYearly={dayOfWeekforYearly}
                                                    setDayOfWeekforYearly={setDayOfWeekforYearly}
                                                    onTheWeek={onTheWeek}
                                                    setOnTheWeek={setOnTheWeek}
                                                    onTheWeekDay={onTheWeekDay}
                                                    setOnTheWeekDay={setOnTheWeekDay} />

                                            }
                                        </>
                                    }

                                    <div className="col-start-1 col-end-2 ...">Reason</div>
                                    <div className="col-start-2 col-end-5 ...">
                                        <Select onValueChange={setReason}>
                                            <SelectTrigger className={cn("w-[150px]",)}>
                                                <SelectValue placeholder={reason} />
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
                                    <div className="col-start-2 col-end-5 ...">
                                        {showOtherReason() &&
                                            <Input
                                                id="otherReason"
                                                type="string"
                                                value={otherReason}
                                                onChange={(e) => setOtherReason(e.target.value)}
                                                className="col-span-1"
                                            />
                                        }
                                    </div>

                                </div>


                            </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={() => { save() }}>
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </>
           
    
        );
    
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
    
    }
 