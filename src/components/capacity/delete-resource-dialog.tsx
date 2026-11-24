import { useState } from "react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { deleteTerminalResource } from "../terminal-resource/terminal-resource-manager-client"
import type { TerminalResourceDomian } from "../terminal-resource/terminal-resource-domain"
import { FormDialog } from "./form-dialog"

export type DeleteTarget = { item: TerminalResourceDomian, name: string, kind: string, note?: string }

// Confirms and runs a delete. Most deletes are soft on the server; closures are removed outright.
export function DeleteResourceDialog({ target, onClose, onDone }: {
  target: DeleteTarget | null
  onClose: () => void
  onDone: () => void | Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => { setError(null); onClose() }

  async function handleDelete() {
    if (!target) return
    setIsSubmitting(true)
    setError(null)
    try {
      await deleteTerminalResource(target.item.terminalId, target.item.sk)
      toast.success(`${target.kind} ${target.name} deleted`)
      await onDone()
      close()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormDialog
      open={target !== null}
      title={`Delete ${target?.kind.toLowerCase() ?? ""}`}
      submitLabel="Delete"
      submittingLabel="Deleting…"
      destructive
      isSubmitting={isSubmitting}
      error={error}
      onClose={close}
      onSubmit={handleDelete}
    >
      {target && (
        <div className="flex items-start gap-4">
          <span className="inline-flex shrink-0 rounded-full p-3 bg-red-100">
            <Trash2 className="size-6 stroke-red-600" />
          </span>
          <div>
            <p className="text-base font-semibold mb-2">Delete {target.name}?</p>
            <p className="text-gray-600">{target.note ?? "It won't be offered for new reservations. Existing reservations keep it."}</p>
          </div>
        </div>
      )}
    </FormDialog>
  )
}
