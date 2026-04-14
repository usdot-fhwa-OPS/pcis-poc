import { useState } from "react";
import { Button } from "../ui/button";
import { Check, ChevronDownIcon, CircleCheckBig } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

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
            <DialogContent className="sm:max-w-md gap-6">
                <DialogHeader>
                    <DialogTitle>Approve Reservation</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <div>
                    <div className="flex items-start gap-4 mb-4">
                        <span className="inline-flex shrink-0 rounded-full p-4 bg-green-100">
                            <CircleCheckBig className="size-8 stroke-green-600" />
                        </span>
                        <div>
                            <p className="font-semibold mb-2">Are you sure you want to approve the reservation for container XX-000?</p>
                            <p>This reservation will be moved to the Ongoing tab and the transportation operator will be notified.</p>
                        </div>
                    </div>
                    <Button variant="ghost" className="group w-full">
                        Show Details
                        <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                    </Button>
                    <div className="pt-2">
                        <p>(Details will go here here)</p>
                    </div>
                    <div className="pt-4">
                        <p className="font-semibold mb-4">Is a TWIC escort required for this reservation?</p>
                        <RadioGroup defaultValue="not-required" className="grid-cols-2 grid-rows-1 gap-6 w-fit">
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="true" id="required" />
                                <Label className="font-normal" htmlFor="required">Yes</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="false" id="not-required" />
                                <Label className="font-normal" htmlFor="not-required">No</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button className="bg-green-600 hover:bg-green-600/90">Yes, Approve</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}