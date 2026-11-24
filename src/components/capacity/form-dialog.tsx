import * as React from "react"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"

type FormDialogProps = {
  open: boolean
  title: string
  submitLabel: string
  submittingLabel?: string
  isSubmitting: boolean
  canSubmit?: boolean
  error?: string | null
  destructive?: boolean
  wide?: boolean
  onClose: () => void
  onSubmit: () => void
  children: React.ReactNode
}

// Shared shell for the /capacity dialogs, matching the I-4 dialogs: header bar, scrolling body, footer buttons.
export function FormDialog({
  open, title, submitLabel, submittingLabel, isSubmitting, canSubmit = true, error, destructive, wide, onClose, onSubmit, children,
}: FormDialogProps) {
  const formId = React.useId()
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isSubmitting && onClose()} disablePointerDismissal>
      <DialogContent
        className={`${wide ? "sm:max-w-xl" : "sm:max-w-md"} gap-6 p-0 text-left max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]`}
      >
        <DialogHeader className="flex flex-row items-center gap-0 min-h-[53px] p-4 border-b">
          <DialogTitle className="text-lg">{title}</DialogTitle>
        </DialogHeader>
        <form
          id={formId}
          className="px-4 grid gap-4 min-h-0 overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit && !isSubmitting) onSubmit()
          }}
        >
          {children}
          {error && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
        <DialogFooter className="mx-0 mb-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            type="submit"
            form={formId}
            variant={destructive ? "destructive" : "default"}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? submittingLabel ?? "Saving…" : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// A labeled form field. `required` adds the red asterisk the I-4 dialogs use.
export function Field({ label, htmlFor, required, hint, children }: {
  label: string, htmlFor?: string, required?: boolean, hint?: string, children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
