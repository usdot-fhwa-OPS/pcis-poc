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

export function DeleteTerminalCapacityButton() {
    const [open, setOpen] = useState(false)
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
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
            <DialogFooter className="center-buttons">
                <Button type="submit">Yes</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>No</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }  