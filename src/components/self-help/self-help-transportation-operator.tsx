import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Button } from "../ui/button"
import { X } from "lucide-react"

export const TransportationCoordinatorAndDispatcherSelfHelp = () => {
    return (
        <div className="self-help-right">
            <Popover>
                <PopoverTrigger asChild>

                    <Button className="self-help">
                        Self-Help
                    </Button>


                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <PopoverClose
                        className="absolute right-[5px] top-[5px] inline-flex size-[25px] cursor-default items-center justify-center"
                        aria-label="Close">
                        <X />
                    </PopoverClose>

                    <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                    >
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                {/* Transportation Operator help title 1*/}
                                How do I view requested jobs?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Transportation Operator help details 1*/}
                                <p>
                                    Any pending transportation requests will appear in the Upcoming tab on
                                    the home page. From here, jobs can be approved or denied.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>
                                {/* Transportation Operator help title 2*/}
                                How do I contact the job requestor?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Transportation Operator help details 2*/}
                                <p>
                                    In the Upcoming tab, select the Contact button in the Contact BCO
                                    column for the applicable Cargo Unit.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>
                                {/* Transportation Operator help title 3*/}
                                How do I mark an item as picked up?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Transportation Operator help details 3*/}
                                <p>
                                    In the Ongoing tab, select the checkbox in the Mark as Picked Up
                                    column to indicate the Cargo Unit has been picked up.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>
                                {/* Transportation Operator help title 4*/}
                                How do I schedule a pickup reservation?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Transportation Operator help details 4*/}
                                <p>
                                    In the Ongoing tab, there is a Reserve button for Cargo Units that do
                                    not yet have a pickup reservation created. Select the Reserve button
                                    to choose a reservation time that is sent to the Terminal Operator for
                                    approval.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                            <AccordionTrigger>
                                {/* Transportation Operator help title 5*/}
                                How do I modify a reservation?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Transportation Operator help details 5*/}
                                <p>
                                    In the Ongoing tab, select the pencil icon in the Modify Reservation
                                    column to make changes to the reservation for the respective Cargo Unit.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-6">
                            <AccordionTrigger>
                                {/* Transportation Operator help title 6*/}
                                How do I view completed pickups?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Transportation Operator help details 6*/}
                                <p>
                                    Select the Completed tab to view previously picked up Cargo Units and
                                    the date of the pickup.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </PopoverContent>
            </Popover>
        </div>
    )
}

