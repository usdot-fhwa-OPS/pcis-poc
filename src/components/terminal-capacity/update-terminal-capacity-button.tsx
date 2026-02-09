"use client"

import { useState, useEffect } from "react"
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
import { Label } from "../ui/label"
import "./terminal-capacity.css"

interface SettingsDialogProps {
  role: string;
  limit: number;
}

export function MaximumTerminalCapacityButton({ role, limit}: SettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const [portCapacity, setPortCapacity] = useState(limit)

    useEffect(() => {
       setPortCapacity(limit);
    }, [limit]);

    // If user is not a Terminal Operator, don't render anything
    if (role !== "Terminal Operator") {
      return null
    }
  
    const handleSubmit = async () => {
    //   try {
    //     const { data: updatePortCapacity } = await client.models.Limit.update({
    //       id: '7bde2cc5-23dc-4f46-b6d9-502133cc2e8c',
    //       portCapacity: portCapacity,
    //     }, {
    //       authMode: 'apiKey',
    //     })
    //     console.log("updated port capacity", updatePortCapacity)
    //   } catch (error) {
    //     console.error ("error updating port capacity", error);
    //   }
    //   setOpen(false)
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
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Update Terminal Capacity</DialogTitle>
              </DialogHeader>
                <div className="dialog-content">
                  <br/>
                  <div className="terminal-row">
                    <Label htmlFor="portCapacity">
                      Terminal Capacity:&nbsp;&nbsp;
                    </Label>
                    <input id="portCapacity" type="number" min={0} max={limit} value={portCapacity}
                           onChange={(e) =>
                              setPortCapacity(Number(e.target.value))
                           }
                           step="1"
                           className="three-chars"
                    />
                     &nbsp;reservations per day
                  </div>
                  <br/>
                </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    )
  }  