"use client"

import { useState } from "react"
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
import { deleteTerminalCapacity } from "./terminal-capacity-client"
import { TerminalCapacityTableMeta } from "./terminal-capacity-table"

export function DeleteTerminalCapacityButton(terminalCapacityUid:string, table:any) {
    const [open, setOpen] = useState(false)

    const deleteTc = async () => {
            deleteTerminalCapacity(terminalCapacityUid).then(async(resp) => { 
                console.log(resp) 
                await (table.options.meta as TerminalCapacityTableMeta)?.fetchTerminalCapacityList();
                setOpen(false);
            });
    
        }
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
            <Button variant="destructive">
              Delete
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
                <Button type="button" onClick={()=>deleteTc()} >Yes</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>No</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }  