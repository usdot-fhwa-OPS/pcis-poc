import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { X } from "lucide-react"
import { Button } from "../ui/button"

export const TerminalOperatorSelfHelp = () => {
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
                                {/* Terminal Operator help title 1*/}
                                How do I view requested cargo reservations?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Terminal Operator help details 1*/}
                                Any pending cargo reservation requests will appear in the Requested tab on the home 
                                page. From here, reservations can be approved or denied.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">

                            <AccordionTrigger>
                                {/* Terminal Operator help title 2*/}
                                How do I view requested modifications to existing cargo reservations?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Terminal Operator help details 2*/}
                                Requested modifications to existing cargo reservations will appear in the Modification 
                                Requested tab, and will show the new proposed date and time requested. From here, the 
                                modified request can be approved or denied.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">

                            <AccordionTrigger>
                                {/* Terminal Operator help title 3*/}
                                How do I import a Stow Plan?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Terminal Operator help details 3*/}
                                Select the Import Stow Plan option in the navigation menu on the left side of the screen. 
                                From here, there are instructions on how to browse for and upload a Stow Plan.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">

                            <AccordionTrigger>
                                {/* Terminal Operator help title 4*/}
                                What format is required for the Stow Plan?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Terminal Operator help details 4*/}
                                The Stow Plan must be a .csv file to be uploaded. There are requirements for the column 
                                orderings and format which are detailed in the Import Stow Plan page.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">

                            <AccordionTrigger>
                                {/* Terminal Operator help title 5*/}
                                How do I view and update the status of ongoing reservations?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Terminal Operator help details 5*/}
                                Ongoing reservations appear in the Ongoing tab. From here, you can review the date and 
                                time for the reservation for each Cargo Unit. For Cargo Units that are late, you can 
                                mark the Cargo Unit as Late for Pick Up using the respective checkbox.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-6">

                            <AccordionTrigger>
                                {/* Terminal Operator help title 6*/}
                                How do I view completed pickups?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Terminal Operator help details 6*/}
                                Select the Completed tab to view previously picked up Cargo Units and the date of the pickup.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-7">

                            <AccordionTrigger>
                                {/* Terminal Operator help title 7*/}
                                How do I view the list of available Transportation Operators?
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* Terminal Operator help details 7*/}
                                Select the Available Operators options in the navigation menu on the left side of the screen 
                                to view Transportation Coordinator and dispatcher that are registered in the system.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                </PopoverContent>
            </Popover>
        </div>
    )
}

