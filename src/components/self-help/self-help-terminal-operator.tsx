import { Inbox, RefreshCw, Upload, FileText, Clock, CheckCircle, Users } from "lucide-react"
import { SelfHelpPanel, SelfHelpItem } from "./self-help-panel"

const items: SelfHelpItem[] = [
    {
        icon: Inbox,
        question: "How do I view requested cargo reservations?",
        answer: "Any pending cargo reservation requests will appear in the Requested tab on the home page. From here, reservations can be approved or denied.",
    },
    {
        icon: RefreshCw,
        question: "How do I view requested modifications to existing cargo reservations?",
        answer: "Requested modifications to existing cargo reservations will appear in the Modification Requested tab, and will show the new proposed date and time requested. From here, the modified request can be approved or denied.",
    },
    {
        icon: Upload,
        question: "How do I import a Stow Plan?",
        answer: "Select the Import Stow Plan option in the navigation menu on the left side of the screen. From here, there are instructions on how to browse for and upload a Stow Plan.",
    },
    {
        icon: FileText,
        question: "What format is required for the Stow Plan?",
        answer: "The Stow Plan must be a .csv file to be uploaded. There are requirements for the column orderings and format which are detailed in the Import Stow Plan page.",
    },
    {
        icon: Clock,
        question: "How do I view and update the status of ongoing reservations?",
        answer: "Ongoing reservations appear in the Ongoing tab. From here, you can review the date and time for the reservation for each Cargo Unit.",
    },
    {
        icon: CheckCircle,
        question: "How do I view completed pickups?",
        answer: "Select the Completed tab to view previously picked up Cargo Units and the date of the pickup.",
    },
    {
        icon: Users,
        question: "How do I view the list of available Transportation Coordinators?",
        answer: "Select the Available Operators option in the navigation menu on the left side of the screen to view Transportation Coordinators that are registered in the system.",
    },
]

export const TerminalOperatorSelfHelp = () => <SelfHelpPanel items={items} />
