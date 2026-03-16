"use client"

import { useState } from "react"
//import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog"
import { Button } from "../ui/button"
import { Label } from "../ui/label"

interface SettingsDialogProps {
  limit: number;
}

export const BerthAvailability = ({limit}: SettingsDialogProps) => {

    const [isDialogOpen, setIsDialogOpen] = useState(true)
    const [berthAvailability, setBerthAvailability] = useState(limit)

    const handleSubmit = async () => {
    }
  
    return (      
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl p-0">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="p-4 border-b">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Berth Availability</h2>
                        </div>
                        <div>
                            <h3 className="text-sm">Set the maximum number of berths available at the terminal.</h3>
                        </div>
                    </DialogHeader>
                    <div className="terminal-row">
                        <Label htmlFor="portCapacity">
                            Berths Available:&nbsp;&nbsp;
                        </Label>
                        <input id="berthAvailability" type="number" min={0} max={limit} value={berthAvailability}
                                onChange={(e) =>
                                    setBerthAvailability(Number(e.target.value))
                                }
                                step="1"
                                className="four-chars"/>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                    </Button>
                    <Button type="submit">Enter Berth Availability</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
 