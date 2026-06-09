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
import { Trash2 } from "lucide-react"
import { deleteTerminalCapacity, terminalCapacityList } from "./terminal-capacity-client"
import { useAppDispatch } from "../../hooks"
import { populate } from "./terminal-capacity-state"

export function DeleteTerminalCapacityButton(terminalCapacityUid:string) {
    const [open, setOpen] = useState(false)
    const dispatch = useAppDispatch()

    const deleteTc = () => {
            deleteTerminalCapacity(terminalCapacityUid).then(async(resp) => { 
                console.log(resp) 
                dispatch(populate(await terminalCapacityList()));
            });
            setOpen(false);
    
        }
    
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
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