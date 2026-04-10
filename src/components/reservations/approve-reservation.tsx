import { useState } from "react";
import { Button } from "../ui/button";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

export const ApproveReservation = () => {

    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleOpen = () => {
        setIsDialogOpen(true)
    }

    return (
        <>
        <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
                setIsDialogOpen(open)
            }}
        >
            <DialogTrigger>
                <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-600/90"
                    onClick={handleOpen}
                >
                    <Check className="inline-block h-4 w-4" />Approve
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Approve Reservation</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <div className="p-8">Content Here</div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button>Yes, Approve</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}