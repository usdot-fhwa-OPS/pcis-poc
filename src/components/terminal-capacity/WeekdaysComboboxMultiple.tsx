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

const weekDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thrusday",
            "Friday",
            "Saturday",
            "Sunday"
       ];

export function WeekdaysComboboxMultiple() {
       const anchor = useComboboxAnchor();
       const [weeklyEvery, setWeeklyEvery] = React.useState<string | undefined>()
       const [weeklyOnDays, setWeeklyOnDays] = React.useState<string[] | undefined>([])

  return (
    <Combobox
          multiple
          autoHighlight
          items={weekDays}
          value={weeklyOnDays}
          defaultValue={[weekDays[0]]}
          onValueChange={setWeeklyOnDays}
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
  )
}