import { Button } from "../ui/button"
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Flag, Ship, SquareChartGantt, User, X } from "lucide-react"

export const TerminalOperatorSelfHelp = () => {
    return (
         <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">Self Help</Button>
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
                        <AccordionTrigger><User />Where can I manage users?</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance">
                            Where can I manage users?
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger><Ship />Where can I find my upconming cargo?</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance">
                            Where can I find my upconming cargo?
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3">
                        <AccordionTrigger><Flag />How can I flag the upcoming carge?</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance">
                            How can I flag the upcoming carge?
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-4">
                        <AccordionTrigger><SquareChartGantt />How can I manage my profile?</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-4 text-balance">
                            How can I manage my profile?
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
                 
            </PopoverContent>
        </Popover>
    )
}

