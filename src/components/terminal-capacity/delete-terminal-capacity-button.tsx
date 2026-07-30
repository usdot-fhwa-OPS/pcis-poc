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
import { deleteTerminalCapacity, terminalCapacityList } from "./terminal-capacity-client"
import { useAppDispatch } from "../../hooks"
import { populate } from "./terminal-capacity-state"
import { Trash2 } from "lucide-react"

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
        <DialogTrigger render={
            <Button
              variant="link"
              className="gap-1 h-auto p-0 text-red-600"
            >
              <Trash2 className="h-[0.875rem] w-[0.875rem]" />
              Delete
            </Button>
        } />
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">Confirmation Required</DialogTitle>
          </DialogHeader>
          <p className="py-2 text-center text-sm text-gray-600">
            Deleting a temporary capacity can't be undone.
            <br />
            Do you want to continue?
          </p>
          <DialogFooter className="flex-row justify-center gap-2 sm:justify-center">
            <Button type="button" onClick={() => deleteTc()}>Yes</Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>No</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }