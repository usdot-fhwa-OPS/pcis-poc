import * as React from "react"
import { format } from "date-fns"
import { CalendarDays, Check, PlusCircle, X } from "lucide-react"
import type { Column } from "@tanstack/react-table"
import type { DateRange } from "react-day-picker"

import { cn } from "../../../lib/utils.ts"
import { Button } from "../button.tsx"
import { Calendar } from "../calendar.tsx"
import { Input } from "../input.tsx"
import { Popover, PopoverContent, PopoverTrigger } from "../popover.tsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select.tsx"
import { getColumnLabel } from "./column-label.ts"
import type { DataTableFilterOption, DateRangeFilterValue } from "./types.ts"

const ALL_VALUE = "__all__"

const triggerClass = "h-8 border-dashed border-gray-300 shadow-none text-gray-700 font-normal"

function getFilterOptions<TData>(column: Column<TData, unknown>): DataTableFilterOption[] {
  const fixed = column.columnDef.meta?.filterOptions
  if (fixed) return fixed
  return Array.from(column.getFacetedUniqueValues().keys())
    .filter((value) => value !== undefined && value !== null && value !== "")
    .map((value) => String(value))
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ label: value, value }))
}

interface ColumnFilterProps<TData> {
  column: Column<TData, unknown>
}

export function DataTableColumnFilter<TData>({ column }: ColumnFilterProps<TData>) {
  switch (column.columnDef.meta?.filterVariant) {
    case "text":
      return <TextFilter column={column} />
    case "select":
      return <SelectFilter column={column} />
    case "multiSelect":
      return <MultiSelectFilter column={column} />
    case "dateRange":
      return <DateRangeFilter column={column} />
    default:
      return null
  }
}

function TextFilter<TData>({ column }: ColumnFilterProps<TData>) {
  const label = getColumnLabel(column)
  return (
    <Input
      placeholder={column.columnDef.meta?.filterPlaceholder ?? `Filter ${label.toLowerCase()}`}
      aria-label={`Filter by ${label}`}
      value={(column.getFilterValue() as string) ?? ""}
      onChange={(event) => column.setFilterValue(event.target.value || undefined)}
      className="w-40 h-8 px-3 py-1.5 border border-gray-300 rounded-md shadow-none text-sm placeholder:text-gray-500"
    />
  )
}

function SelectFilter<TData>({ column }: ColumnFilterProps<TData>) {
  const label = getColumnLabel(column)
  const options = getFilterOptions(column)
  const selected = (column.getFilterValue() as string[] | undefined)?.[0]
  return (
    <Select
      value={selected ?? ALL_VALUE}
      onValueChange={(value) => column.setFilterValue(value === ALL_VALUE ? undefined : [value])}
    >
      <SelectTrigger aria-label={`Filter by ${label}`} className={cn(triggerClass, "w-auto min-w-36 gap-2")}>
        <span className="text-gray-500">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function MultiSelectFilter<TData>({ column }: ColumnFilterProps<TData>) {
  const label = getColumnLabel(column)
  const options = getFilterOptions(column)
  const selected = new Set((column.getFilterValue() as string[] | undefined) ?? [])
  const counts = column.getFacetedUniqueValues()

  const toggle = (value: string) => {
    const next = new Set(selected)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    column.setFilterValue(next.size ? Array.from(next) : undefined)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClass}>
          <PlusCircle />
          {label}
          {selected.size > 0 && (
            <span className="ml-1 rounded bg-gray-900 px-1.5 py-0.5 text-xs text-white">
              {selected.size}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-1">
        <div className="max-h-72 overflow-y-auto">
          {options.length === 0 && <p className="px-2 py-1.5 text-sm text-gray-500">No values</p>}
          {options.map((option) => {
            const isSelected = selected.has(option.value)
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemcheckbox"
                aria-checked={isSelected}
                onClick={() => toggle(option.value)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-100"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-gray-400",
                    isSelected && "border-gray-900 bg-gray-900 text-white",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                <span className="flex-1 truncate">{option.label}</span>
                <span className="text-xs text-gray-500">{counts.get(option.value) ?? ""}</span>
              </button>
            )
          })}
        </div>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => column.setFilterValue(undefined)}
            className="mt-1 w-full rounded border-t px-2 py-1.5 text-center text-sm hover:bg-gray-100"
          >
            Clear
          </button>
        )}
      </PopoverContent>
    </Popover>
  )
}

function DateRangeFilter<TData>({ column }: ColumnFilterProps<TData>) {
  const label = getColumnLabel(column)
  const range = column.getFilterValue() as DateRangeFilterValue | undefined
  const [open, setOpen] = React.useState(false)

  const summary = range?.from
    ? range.to
      ? `${format(range.from, "MMM d")} – ${format(range.to, "MMM d")}`
      : `From ${format(range.from, "MMM d")}`
    : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClass}>
          <CalendarDays />
          {label}
          {summary && <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-900">{summary}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={range as DateRange | undefined}
          defaultMonth={range?.from}
          onSelect={(next) => column.setFilterValue(next?.from || next?.to ? next : undefined)}
        />
        {range && (
          <div className="flex justify-end border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                column.setFilterValue(undefined)
                setOpen(false)
              }}
            >
              <X />
              Clear dates
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
