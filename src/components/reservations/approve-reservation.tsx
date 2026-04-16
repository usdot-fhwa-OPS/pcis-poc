import { useState } from "react";
import { Button } from "../ui/button";
import { Check, ChevronDownIcon, CircleCheckBig } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

export const ApproveReservation = () => {

    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleOpen = () => {
        setIsDialogOpen(true)
    }

    const [isOpen, setIsOpen] = useState(false)

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
            <DialogContent className="sm:max-w-md gap-6 p-0">
                <DialogHeader className="flex flex-row items-center gap-0 min-h-[53px] p-4 border-b">
                    <DialogTitle>Approve Reservation</DialogTitle>
                </DialogHeader>
                <div className="px-4">
                    <div className="flex items-start gap-4 mb-6">
                        <span className="inline-flex shrink-0 rounded-full p-3 bg-green-100">
                            <CircleCheckBig className="size-6 stroke-green-600" />
                        </span>
                        <div>
                            <p className="text-base font-semibold mb-2">Are you sure you want to approve the reservation for container <span className="inline-block">XX-000</span>?</p>
                            <p className="text-gray-600">This reservation will be moved to the Ongoing tab and the transportation operator will be notified.</p>
                        </div>
                    </div>
                    <Collapsible 
                        open={isOpen}
                        onOpenChange={setIsOpen}
                        className="mb-6 pb-4 border-b"
                    >
                        <CollapsibleTrigger asChild>
                            <Button variant="link" className="group w-fit">
                                {isOpen ? "Hide Details" : "Show Details"}
                                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-y-2 sm:gap-x-8 sm:gap-y-4 items-start pb-3 sm:pb-0">
                                <div className="font-semibold pt-4 sm:pt-0">Vessel ID:</div>
                                <div>Number</div>
                                <div className="font-semibold pt-4 sm:pt-0">Reservation ID:</div>
                                <div>Number</div>
                                <div className="font-semibold pt-4 sm:pt-0">Terminal Origin:</div>
                                <div>Country</div>
                                <div className="font-semibold pt-4 sm:pt-0">Terminal Manager:</div>
                                <div>
                                    <p>Name</p>
                                    <p className="break-all">email@emailcompany.com</p>
                                    <p>555-555-5555</p>
                                </div>
                                <div className="font-semibold pt-4 sm:pt-0">BCO:</div>
                                <div>
                                    <p>Name</p>
                                    <p className="break-all">email@emailcompany.com</p>
                                    <p>555-555-5555</p>
                                </div>
                                <div className="font-semibold pt-4 sm:pt-0">Transportation Operator:</div>
                                <div>
                                    <p>Name</p>
                                    <p className="break-all">email@emailcompany.com</p>
                                    <p>555-555-5555</p>
                                </div>
                                <div className="font-semibold pt-4 sm:pt-0">Date and Time Requested:</div>
                                <div className="flex gap-4 items-center">
                                    <div>00/00/0000</div>
                                    <div>00:00 AM</div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                    <p className="font-semibold mb-4">Is a <abbr className="decoration-[1px] decoration-dotted underline-offset-4" title="Transportation Worker Identification Credential">TWIC</abbr> escort required for this reservation?</p>
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
                <DialogFooter className="mx-0 mb-0">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button className="bg-green-600 hover:bg-green-600/90">Yes, Approve</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}