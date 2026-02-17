"use client"

import { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import "./terminal-capacity.css"

interface SettingsDialogProps {
  role: string;
  limit: number;
}

export function DeleteTerminalCapacityButton({ role }: SettingsDialogProps) {
    const [open, setOpen] = useState(false)

    // If user is not a Terminal Operator, don't render anything
    if (role !== "Terminal Operator") {
      return null
    }
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 mr-0">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Open settings</span>
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader className="p-4 border-b">
              <DialogTitle>CONFIRMATION REQUIRED</DialogTitle>
            </DialogHeader>
              <div className="dialog-content center-text">
                <br/>
                <div className="center-text">
                    Deleting a temporary capacity can't be undone
                </div>
                Do you want to continue?
              </div>
            <DialogFooter className="flex justify-center gap-4">
                <Button type="submit">Yes</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>No</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }  