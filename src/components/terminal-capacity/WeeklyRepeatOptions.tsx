import * as React from "react"

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "../ui/combobox"
import { Label } from "../ui/label";
import { Input } from "../ui/input";

const weekDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
       ];

export function WeeklyRepeatOptions({weeklyEvery, setWeeklyEvery, weeklyOnDays, setWeeklyOnDays}:
  {weeklyEvery:any, setWeeklyEvery:any, weeklyOnDays:any, setWeeklyOnDays:any}
) {
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
          id="weeklyEvery"

          type="number"
          value={weeklyEvery}
          onChange={(e) => setWeeklyEvery(e.target.value)}
          className="col-span-1"
          min="0"
          step="1"
        />


      </div>
      <div className="col-start-3 col-end-6 ...">
        <Label htmlFor="terminalCapacity" className="text-left">
          weeks
        </Label>

      </div>
      <div className="col-start-1 col-end-2 ...">
        <Label htmlFor="terminalCapacity" className="text-right">
          On day(s):
        </Label>
      </div>
      <div className="col-3">
        <Combobox
          multiple
          autoHighlight
          value={weeklyOnDays}
          items={weekDays}
          defaultValue={[weekDays[0]]}
          onValueChange={(value) => { setWeeklyOnDays(value) }}
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
      <div className="col-span-5">
        <span>This temporary capacity will repeat every {weeklyEvery} weeks</span>
        <span><br></br>on {weeklyOnDays?.map((day:any, i:number, array:any) => { return day + ((i < (array.length - 1)) ? ' and ' : '') })}</span>
      </div>

    </>


  )
}

