"use client"

import { useState } from "react";
//import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Dialog, DialogContent, DialogHeader } from "../ui/dialog";
import { Button } from "../ui/button";

export const BerthAvailability = () => {

    const [isDialogOpen, setIsDialogOpen] = useState(true)
  
    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Berth Availability</h2>
            </div>
            <div>  
              <h3 className="text-sm">Set the maximum number of berths available at the terminal.</h3>
            </div>
            <div>
                Berths Available:
            </div>
            <Button>Cancel</Button>
            <Button>Enter Berth Availability</Button>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
}
 