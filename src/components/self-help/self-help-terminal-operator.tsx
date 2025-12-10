import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { X } from "lucide-react"
import { Label } from "@radix-ui/react-label"

export const TerminalOperatorSelfHelp = () => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <div className="self-help-right">
                    <Label className="self-help">
                        Help
                    </Label>

                </div>

            </PopoverTrigger>
            <PopoverContent className="w-80">
                <PopoverClose
                    className="absolute right-[5px] top-[5px] inline-flex size-[25px] cursor-default items-center justify-center rounded-full text-violet11 outline-none hover:bg-violet4 focus:shadow-[0_0_0_2px] focus:shadow-violet7"
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
                            {/* TODO Terminal Operatorr  help title 1*/}
                            Where can I manage users?
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance">
                            {/* TODO Terminal Operatorr  help details 1*/}
                            Where can I manage users?
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">

                        <AccordionTrigger>
                            {/* TODO Terminal Operatorr  help title 2*/}
                            Where can I find my upconming cargo?
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance">
                            {/* TODO Terminal Operatorr  help details 2*/}
                            Where can I find my upconming cargo?
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">

                        <AccordionTrigger>
                            {/* TODO Terminal Operatorr  help title 3*/}
                            How can I flag the upcoming carge?
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance">
                            {/* TODO Terminal Operatorr  help details 3*/}
                            How can I flag the upcoming carge?
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">

                        <AccordionTrigger>
                            {/* TODO Terminal Operatorr  help title 4*/}
                            How can I manage my profile?
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance">
                            {/* TODO Terminal Operatorr  help details 4*/}
                            How can I manage my profile?
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

            </PopoverContent>
        </Popover>
    )
}

