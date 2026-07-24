
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../lib/utils";

const repeatCycleOption = ["Each" , "OnThe"];

const weekNumber = ["First" , "Second" , "Third" , "Fourth" , "Last"];
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

export function MonthlyRepeatOptions({monthlyEvery, setMonthlyEvery,
                                      repeatCycle, setRepeatCycle,
                                      daysOfMonth, setDaysOfMonth,
                                      onTheWeek, setOnTheWeek,
                                      onTheWeekDay, setOnTheWeekDay}:{monthlyEvery:any, setMonthlyEvery:any,
                                      repeatCycle:any, setRepeatCycle:any,
                                      daysOfMonth:any, setDaysOfMonth:any,
                                      onTheWeek:any, setOnTheWeek:any,
                                      onTheWeekDay:any, setOnTheWeekDay:any}) {

  const toggleDay = (day: string) => {
    const dOfM = [...(daysOfMonth ?? [])]
    const idx = dOfM.indexOf(day)
    if (idx === -1) {
      dOfM.push(day)
    } else {
      dOfM.splice(idx, 1)
    }
    setDaysOfMonth(dOfM)
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
          <div className="col-start-2 col-span-4">
            <div className="grid grid-cols-7 gap-1 rounded-lg border p-3">
              {DAYS.map((day) => {
                const isSelected = daysOfMonth?.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={cn(
                      "h-8 w-8 rounded-md text-sm transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {parseInt(day)}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="col-span-5">
            <span>This temporary capacity will repeat every {monthlyEvery} month(s)</span>
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
            <span>This temporary capacity will repeat every {monthlyEvery} month(s)</span>
            <span><br></br>on the {onTheWeek} {onTheWeekDay}</span>
          </div>

        </>

      }

    </>


  )
}
