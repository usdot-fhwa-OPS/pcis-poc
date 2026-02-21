import * as React from "react"


const weekDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thrusday",
            "Friday",
            "Saturday",
            "Sunday"
       ];

export function WeekdaysMultipleSelect() {
       const [weeklyEvery, setWeeklyEvery] = React.useState<string | undefined>()
       const [weeklyOnDays, setWeeklyOnDays] = React.useState<string[] | undefined>([])

  return (
    <select name="weeklyOnDays" id="weeklyOnDays" multiple>
      {weekDays.map((value) =>{
        return (<option className="data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex w-full cursor-default items-center outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0"
          onClick={()=>{}}
          value={value}>{value}</option>)
      })
    }
    
    
  </select>
  
  )
}