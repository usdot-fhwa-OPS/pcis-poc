
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Calendar } from "../ui/calendar";
import React from "react";
import { format } from "date-fns";

const repeatCycleOption = ["Each" , "OnThe"];

const weekNumber = ["First" , "Second" , "Third" , "Fourth" , "Last"];
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function MonthlyRepeatOptions({monthlyEvery, setMonthlyEvery, 
                                      repeatCycle, setRepeatCycle,
                                      daysOfMonth, setDaysOfMonth,
                                      onTheWeek, setOnTheWeek,
                                      onTheWeekDay, setOnTheWeekDay}:{monthlyEvery:any, setMonthlyEvery:any, 
                                      repeatCycle:any, setRepeatCycle:any,
                                      daysOfMonth:any, setDaysOfMonth:any,
                                      onTheWeek:any, setOnTheWeek:any,
                                      onTheWeekDay:any, setOnTheWeekDay:any}) {

const [date, setDate] = React.useState<Date | undefined>(new Date())

  

  const addDays = (newDate:Date) =>{

    daysOfMonth?.push(newDate ? format(newDate, "dd"):'' );
    setDaysOfMonth(daysOfMonth);
  }
  
  return (

    <>
      <div className="col-start-1 col-end-2 ...">
        <Label htmlFor="terminalCapacity" className="text-right">
          Every
        </Label>
      </div>
      <div className="col-3">

        <Input
          id="weeklyEvery"

          type="number"
          value={monthlyEvery}
          onChange={(e) => setMonthlyEvery(e.target.value)}
          className="col-span-1"
          min="0"
          step="1"
        />


      </div>
      <div className="col-start-3 col-end-6 ...">
        <Label htmlFor="terminalCapacity" className="text-left">
          months
        </Label>

      </div>
      <div className="col-start-1 col-end-2 ...">
        <Label htmlFor="terminalCapacity" className="text-right">
          Cycle:
        </Label>
      </div>
      <div className="col-3">
        <Select onValueChange={setRepeatCycle}>
          <SelectTrigger className="w-full max-w-48">
            <SelectValue placeholder={repeatCycle} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {repeatCycleOption.map((item) => {
                return (<SelectItem value={item}>{item}</SelectItem>)
              })}

            </SelectGroup>
          </SelectContent>
        </Select>        
      </div>

      {('Each' === repeatCycle) &&

        <>
          <div className="col-start-1 col-end-2 ...">
            <Label htmlFor="terminalCapacity" className="text-right">
              Each:
            </Label>
          </div>
          <div className="col-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(value:any) => { setDate(value); addDays(value) }}
              className="rounded-lg border"
              captionLayout="dropdown"
            />
          </div>
          <div className="col-span-5">
            <span>This temporary capacity will repeat every {monthlyEvery} months</span>
            <span><br></br>on the {daysOfMonth?.map((day:any, i:number, array:any) => { return day + ((i < (array.length - 1)) ? ' and ' : '') })}</span>
          </div>

        </>

      }

      {('OnThe' === repeatCycle) &&

        <>
          <div className="col-start-1 col-end-2 ...">
            <Label htmlFor="terminalCapacity" className="text-right">
              On The:
            </Label>
          </div>
          <div className="col-3">
            <Select onValueChange={setOnTheWeek}>
              <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder={onTheWeek} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {weekNumber.map((item) => {
                    return (<SelectItem value={item}>{item}</SelectItem>)
                  })}

                </SelectGroup>
              </SelectContent>
            </Select>        
          </div>
          <div className="col-3">
            <Select onValueChange={setOnTheWeekDay}>
              <SelectTrigger className="w-full max-w-48">
                <SelectValue placeholder={onTheWeekDay} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {weekDays.map((item) => {
                    return (<SelectItem value={item}>{item}</SelectItem>)
                  })}

                </SelectGroup>
              </SelectContent>
            </Select>        
          </div>
          <div className="col-span-5">
            <span>This temporary capacity will repeat every {monthlyEvery} months</span>
            <span><br></br>on the {onTheWeek} {onTheWeekDay}</span>
          </div>

        </>

      }

    </>


  )
}

