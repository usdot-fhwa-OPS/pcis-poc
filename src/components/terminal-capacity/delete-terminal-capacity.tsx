import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tooltip, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { deleteTerrminalCapacity } from "./terminal-capacity-client";


export const DeleteTerminalCapacity = (terminalCapacityUid:string) => {

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const handleOpen = async () => {
              setIsDialogOpen(true)
            }

    

    const deleteTc = async () => {

        

        deleteTerrminalCapacity(terminalCapacityUid).then((resp) => { 
            console.log(resp) 
            setIsDialogOpen(false);
        });

    }
  
    return (
        <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
                setIsDialogOpen(open)

            }}
        >
            <DialogTrigger asChild>
                <TooltipProvider>
                    <Tooltip delayDuration={300}>
                        <TooltipTrigger>
                            <div>
                              <a onClick={handleOpen}>Delete</a>

                            </div>
                        </TooltipTrigger>

                    </Tooltip>
                </TooltipProvider>
            </DialogTrigger>
            <DialogContent>
                <div className="grid grid-cols-3 gap-2">
                    <div className="h-10 col-span-3 col-start-1 ...">
                        <DialogHeader>
                            <DialogTitle>Confirmation Required</DialogTitle>
                            <DialogDescription></DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="col-span-3">
                            <Label htmlFor="terminalCapacity" className="text-center">
                                Deleting a Terminal Capacity can't be undone.
                            </Label>
                   </div>
                   <div className="col-span-3">
                                <Label htmlFor="terminalCapacity" className="text-center">
                                    Do you want to continue?.
                                </Label>
                    </div>
                 </div>          

                <DialogFooter>
                    
                            <Button variant="outline" onClick={() => deleteTc()}>
                                Yes
                            </Button>
                            
                            <Button onClick={() => { setIsDialogOpen(false)}}>
                                No
                            </Button>

                    
                </DialogFooter>
            </DialogContent>
        </Dialog>

    );

    

}

 