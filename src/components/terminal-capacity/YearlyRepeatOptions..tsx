
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import React from "react";
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxItem, ComboboxList, ComboboxValue, useComboboxAnchor } from "../ui/combobox";
import { Checkbox } from "../ui/checkbox";


const weekNumber = ["First" , "Second" , "Third" , "Fourth" , "Last"];
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thrusday', 'Friday', 'Saturday', 'Sunday'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
                'November', 'December'];

export function YearlyRepeatOptions({yearlyEvery, setYearlyEvery, 
                                      monthsOfYear, setMonthsOfYear,
                                      dayOfWeekforYearly, setDayOfWeekforYearly,
                                      onTheWeek, setOnTheWeek,
                                      onTheWeekDay, setOnTheWeekDay}:{yearlyEvery:any, setYearlyEvery:any, 
                                      monthsOfYear:any, setMonthsOfYear:any,
                                      dayOfWeekforYearly:any,setDayOfWeekforYearly:any
                                      onTheWeek:any, setOnTheWeek:any,
                                      onTheWeekDay:any, setOnTheWeekDay:any}) {

const anchor = useComboboxAnchor();
 
  return (

    <>
      <div className="col-start-1 col-end-2 ...">
        <Label htmlFor="terminalCapacity" className="text-right">
          Every
        </Label>
      </div>
      <div className="col-3">

        <Input
          id="yearlyEvery"

          type="number"
          value={yearlyEvery}
          onChange={(e) => setYearlyEvery(e.target.value)}
          className="col-span-1"
          min="0"
          step="1"
        />


      </div>
      <div className="col-start-3 col-end-6 ...">
        <Label htmlFor="terminalCapacity" className="text-left">
          years
        </Label>

      </div>
      <div className="col-start-1 col-end-2 ...">
        <Label htmlFor="terminalCapacity" className="text-right">
          Month(s):
        </Label>
      </div>
      <div className="col-3">
        <Combobox
          multiple
          autoHighlight
          value={monthsOfYear}
          items={months}
          defaultValue={[months[0]]}
          onValueChange={(value) => { setMonthsOfYear(value) }}
        >
          <ComboboxChips ref={anchor} className="w-full max-w-xs">
            <ComboboxValue>
              {(values) => (
                <React.Fragment>
                  {values.map((value: string) => (
                    <ComboboxChip key={value}>{value}</ComboboxChip>
                  ))}
                  <ComboboxChipsInput />
                </React.Fragment>
              )}
            </ComboboxValue>
          </ComboboxChips>
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>No items found.</ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>      
      </div>

        <div className="col-start-1 col-end-2 ...">
          <Checkbox checked={dayOfWeekforYearly} onCheckedChange={setDayOfWeekforYearly} />

        </div>
        <div className="col-3">
          Day of the week
        </div>
        


      {(dayOfWeekforYearly) &&

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
          

        </>
        

      }
        <div className="col-span-5">
            <span>This temporary capacity will repeate every {yearlyEvery} years</span>
            <span><br></br>on the {onTheWeek} {onTheWeekDay}</span>
            <span> of {monthsOfYear?.map((month:any, i:number, array:any) => { return month + ((i < (array.length - 1)) ? ' and ' : '') })}</span>
          </div>
    </>


  )
}

