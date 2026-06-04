import { useState } from "react"
import { X, LucideIcon } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion"
import { Button } from "../ui/button"

export interface SelfHelpItem {
    icon: LucideIcon
    question: string
    answer: string
}

interface SelfHelpPanelProps {
    items: SelfHelpItem[]
}

export const SelfHelpPanel = ({ items }: SelfHelpPanelProps) => {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setOpen(o => !o)}
                className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-gray-900 text-white border-0 px-2 py-5 rounded-l-lg [writing-mode:vertical-lr] text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
            >
                Self Help
            </button>

            {open && (
                <div className="fixed right-10 top-1/2 -translate-y-1/2 w-80 bg-white rounded-lg shadow-2xl z-50 overflow-hidden max-h-[70vh] flex flex-col border border-gray-200">
                    <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between flex-shrink-0 rounded-t-lg">
                        <span className="font-semibold text-sm">Self Help</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(false)}
                            className="h-6 w-6 text-white hover:bg-transparent hover:text-gray-300"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="overflow-y-auto">
                        <Accordion type="single" collapsible className="w-full">
                            {items.map((item, i) => (
                                <AccordionItem key={i} value={`item-${i}`} className="px-4">
                                    <AccordionTrigger className="py-4 text-left text-sm font-normal hover:no-underline">
                                        <div className="flex items-center gap-3 text-left pr-2">
                                            <item.icon className="h-4 w-4 flex-shrink-0 text-gray-500" />
                                            <span>{item.question}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="text-sm text-gray-600 pl-7">
                                        {item.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            )}
        </>
    )
}
