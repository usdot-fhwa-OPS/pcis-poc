import { useState } from "react";
import { Button } from "../ui/button";
import { Check, ChevronDownIcon, CircleCheckBig } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { TerminalOperatorDataTableMeta } from "../terminal-bookings/data-table.tsx";

interface ApproveButtonProps {
    vesselId: string
    cargoId: string
    origin: string
    bcoName: string
    bcoEmail: string
    transopName: string
    transopEmail: string
    reservationDate: string
    reservationTime: string
    dataTableMeta: any
}

export function ApproveReservation({vesselId, cargoId, origin, bcoName, bcoEmail, transopName, transopEmail, reservationDate, reservationTime, dataTableMeta}: ApproveButtonProps) {

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState(false)

    const handleOpen = () => {
        setIsDialogOpen(true);
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
            <DialogContent className="sm:max-w-md gap-6 p-0">
                <DialogHeader className="flex flex-row items-center gap-0 min-h-[53px] p-4 border-b">
                    <DialogTitle className="text-lg">Approve Reservation</DialogTitle>
                </DialogHeader>
                <div className="px-4">
                    <div className="flex items-start gap-4 mb-6">
                        <span className="inline-flex shrink-0 rounded-full p-3 bg-green-100">
                            <CircleCheckBig className="size-6 stroke-green-600" />
                        </span>
                        <div>
                            <p className="text-base font-semibold mb-2">Are you sure you want to approve the reservation for container <span className="inline-block">{cargoId}</span>?</p>
                            <p className="text-gray-600">This reservation will be moved to the Ongoing tab and the transportation operator will be notified.</p>
                        </div>
                    </div>
                    <Collapsible 
                        open={isOpen}
                        onOpenChange={setIsOpen}
                        className="mb-6 pb-4 border-b"
                    >
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" className="group w-fit">
                                {isOpen ? "Hide Details" : "Show Details"}
                                <ChevronDownIcon className="ml-auto group-data-[state=open]:rotate-180" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-y-2 sm:gap-x-8 sm:gap-y-4 items-start pb-3 sm:pb-0">
                                <div className="font-semibold pt-4 sm:pt-0">Vessel ID:</div>
                                <div>{vesselId}</div>
                                <div className="font-semibold pt-4 sm:pt-0">Terminal Origin:</div>
                                <div>{origin}</div>
                                <div className="font-semibold pt-4 sm:pt-0">BCO:</div>
                                <div>
                                    <p>{bcoName}</p>
                                    <p className="break-all"><a href={`mailto:${bcoEmail}`} className="text-blue-500 hover:underline">{bcoEmail}</a></p>
                                </div>
                                <div className="font-semibold pt-4 sm:pt-0">Transportation Operator:</div>
                                <div>
                                    <p>{transopName}</p>
                                    <p className="break-all"><a href={`mailto:${transopEmail}`} className="text-blue-500 hover:underline">{transopEmail}</a></p>
                                </div>
                                <div className="font-semibold pt-4 sm:pt-0">Date and Time Requested:</div>
                                <div className="flex gap-4 items-center">
                                    <div>{reservationDate}</div>
                                    <div>{reservationTime}</div>
                                </div>
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                    <p className="text-base font-semibold mb-4">Is a <abbr className="decoration-[1px] decoration-dotted underline-offset-4" title="Transportation Worker Identification Credential">TWIC</abbr> escort required for this reservation?</p>
                    <RadioGroup defaultValue={String(selectedValue)} onValueChange={(value) => setSelectedValue(value === "true")} className="grid-cols-2 grid-rows-1 gap-6 w-fit">
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="true" id="required"/>
                            <Label className="text-base font-normal" htmlFor="required">Yes</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <RadioGroupItem value="false" id="not-required"/>
                            <Label className="text-base font-normal" htmlFor="not-required">No</Label>
                        </div>
                    </RadioGroup>
                </div>
                <DialogFooter className="mx-0 mb-0">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button
                        className="bg-green-600 hover:bg-green-600/90"
                        onClick={() =>  {
                            (dataTableMeta as TerminalOperatorDataTableMeta)?.updateBooking(cargoId, "Pending Pick Up"); 
                            (dataTableMeta as TerminalOperatorDataTableMeta)?.updateTwicEscortRequired(cargoId, selectedValue);
                        }}
                    >
                        Yes, Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}