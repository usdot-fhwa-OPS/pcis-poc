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
                    <Accordion
                        type="single"
                        collapsible
                        className="w-full"
                    >
                        <AccordionItem value="item-1">

                            <AccordionTrigger>
                                {/* TODO Beneficiary Cargo Owner  help title 1*/}
                                Beneficiary Cargo Owner Product Information
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* TODO Beneficiary Cargo Owner  help details 1*/}
                                <p>
                                    Our flagship product combines cutting-edge technology with sleek
                                    design. Built with premium materials, it offers unparalleled
                                    performance and reliability.
                                </p>
                                <p>
                                    Key features include advanced processing capabilities, and an
                                    intuitive user interface designed for both beginners and experts.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">

                            <AccordionTrigger>
                                {/* TODO Beneficiary Cargo Owner  help title 2*/}
                                Beneficiary Cargo Owner Shipping Details
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* TODO Beneficiary Cargo Owner  help details 2*/}
                                <p>
                                    We offer worldwide shipping through trusted courier partners.
                                    Standard delivery takes 3-5 business days, while express shipping
                                    ensures delivery within 1-2 business days.
                                </p>
                                <p>
                                    All orders are carefully packaged and fully insured. Track your
                                    shipment in real-time through our dedicated tracking portal.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">

                            <AccordionTrigger>
                                {/* TODO Beneficiary Cargo Owner  help title 3*/}
                                Beneficiary Cargo Owner Return Policy
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-4 text-balance">
                                {/* TODO Beneficiary Cargo Owner  help details 3*/}
                                <p>
                                    We stand behind our products with a comprehensive 30-day return
                                    policy. If you&apos;re not completely satisfied, simply return the
                                    item in its original condition.
                                </p>
                                <p>
                                    Our hassle-free return process includes free return shipping and
                                    full refunds processed within 48 hours of receiving the returned
                                    item.
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

