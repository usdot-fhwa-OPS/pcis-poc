"use client"

import { useState } from "react"
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
                    <DialogHeader className="p-4 border-b-0">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold">Berth Availability</h2>
                        </div>
                        <div>
                            <h3 className="text-sm">Set the maximum number of berths available at the terminal.</h3>
                        </div>
                    </DialogHeader>
                    <div className="ml-4 flex gap-2">
                        <Label htmlFor="portCapacity">
                            Berths Available:
                        </Label>
                        <input id="berthAvailability" type="number" min={0} max={limit} value={berthAvailability}
                                onChange={(e) =>
                                    setBerthAvailability(Number(e.target.value))
                                }
                                step="1"
                                className="w-8"/>
                    </div>
                    <br/>
                    <br/>
                    <div className="ml-35 flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                        </Button>
                        <Button type="submit">Enter Berth Availability</Button>
                    </div>
                    <br/>
                </form>
            </DialogContent>
        </Dialog>
    );
}
 