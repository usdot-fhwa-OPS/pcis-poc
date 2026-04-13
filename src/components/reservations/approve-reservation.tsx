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
                <div>
                    <p>Are you sure you want to approve the reservation for container XX-000?</p>
                    <p>This reservation will be moved to the Ongoing tab and the transportation operator will be notified.</p>
                    <p>Show Details</p>
                    <p>(Details here)</p>
                    <p>Is a TWIC escort required for this reservation?</p>
                    <p>Yes No</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button>Yes, Approve</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}