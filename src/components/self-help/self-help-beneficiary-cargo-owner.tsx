import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { X } from "lucide-react"
import { Button } from "../ui/button"

export const BeneficiaryCargoOwnerSelfHelp = () => {
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
                                {/* Beneficiary Cargo Owner help title 1*/}
                                How do I view the status of cargo?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Beneficiary Cargo Owner help details 1*/}
                                <p>
                                    The home page contains all Cargo Units, which are separated into
                                    three tabs based on status: Upcoming, Ongoing, and Completed.
                                    Select the appropriate tab to view the respective Cargo Units.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">

                            <AccordionTrigger>
                                {/* Beneficiary Cargo Owner help title 2*/}
                                How do I assign a Transportation Coordinator for cargo?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Beneficiary Cargo Owner help details 2*/}
                                <p>
                                    In the Upcoming tab, Cargo Units that have not been assigned to a
                                    Transportation Coordinator will appear. Once the Cargo Unit status is
                                    updated to On-Dock by the Terminal Operator, the Assign button
                                    becomes available to assign a Transportation Coordinator for the
                                    Cargo Unit.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">

                            <AccordionTrigger>
                                {/* Beneficiary Cargo Owner help title 3*/}
                                How do I contact a Transportation Coordinator for an assigned cargo pickup?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Beneficiary Cargo Owner help details 3*/}
                                <p>
                                    In the Ongoing tab there is a Contact button for each Cargo Unit
                                    that can be used to contact the Transportation Coordinator for
                                    assigned pickups.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">

                            <AccordionTrigger>
                                {/* Beneficiary Cargo Owner help title 4*/}
                                How do I view a history of completed cargo pickups?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Beneficiary Cargo Owner help details 4*/}
                                <p>
                                    Select the Completed tab to view previously picked up Cargo Units and
                                    the date of the pickup.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <PopoverClose
                        className="absolute right-[5px] top-[5px] inline-flex size-[25px] cursor-default items-center justify-center rounded-full text-violet11 outline-none hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7"
                        aria-label="Close">
                        <X />
                    </PopoverClose>

                </PopoverContent>
            </Popover>
        </div >
    )
}

