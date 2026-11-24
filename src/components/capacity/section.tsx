import * as React from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "../ui/button"

export function SectionHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className="flex max-sm:flex-col items-start sm:items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function RowActions({ name, onEdit, onDelete }: { name: string, onEdit: () => void, onDelete: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${name}`} title="Edit"><Pencil /></Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Delete ${name}`} title="Delete"><Trash2 /></Button>
    </div>
  )
}

export function StatusBadge({ on, onLabel, offLabel }: { on: boolean, onLabel: string, offLabel: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${on ? "bg-green-50 text-green-700 ring-1 ring-green-600/20" : "bg-gray-100 text-gray-600 ring-1 ring-gray-500/20"}`}>
      {on ? onLabel : offLabel}
    </span>
  )
}
