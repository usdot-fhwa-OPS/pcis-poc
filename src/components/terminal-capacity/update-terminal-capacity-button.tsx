"use client"

import { useState, useEffect } from "react"
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
import { TerminalCapacityDomain } from "./terminal-capacity-domain"
import { saveTerminalCapacity } from "./terminal-capacity-client"


export function UpdateTerminalCapacityButton({maxTerminalCapacity}: {maxTerminalCapacity:TerminalCapacityDomain}) {
    const [open, setOpen] = useState(false)
    const [portCapacity, setPortCapacity] = useState(maxTerminalCapacity?.capacity)
    

    useEffect(() => {
       setPortCapacity(maxTerminalCapacity?.capacity);
    }, [maxTerminalCapacity?.capacity]);
  
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
    
  const save = async () => {
    const updatedMaxTc = {...maxTerminalCapacity};
    updatedMaxTc.capacity = portCapacity;

    saveTerminalCapacity(updatedMaxTc).then(async (resp) => {
      console.log(resp)

    });
    setOpen(false);
  }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium underline-offset-2 hover:underline bg-transparent border-none cursor-pointer p-0">
              Update
            </button>
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
                    <input id="portCapacity" type="number" min={0} value={portCapacity}
                           onChange={(e) =>
                              setPortCapacity(Number(e.target.value))
                           }
                           step="1"
                           className="four-chars"
                    />
                     &nbsp;reservations per day
                  </div>
                  <br/>
                </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" onClick={()=>save()}>Save</Button>
              </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    )
  }  