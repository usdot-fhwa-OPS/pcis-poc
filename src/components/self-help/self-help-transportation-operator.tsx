import { Inbox, Phone, CheckSquare, CalendarPlus, Pencil, CheckCircle } from "lucide-react"
import { SelfHelpPanel, SelfHelpItem } from "./self-help-panel"

const items: SelfHelpItem[] = [
    {
        icon: Inbox,
        question: "How do I view requested jobs?",
        answer: "Any pending transportation requests will appear in the Upcoming tab on the home page. From here, jobs can be approved or denied.",
    },
    {
        icon: Phone,
        question: "How do I contact the job requestor?",
        answer: "In the Upcoming tab, select the Contact button in the Contact BCO column for the applicable Cargo Unit.",
    },
    {
        icon: CheckSquare,
        question: "How do I mark an item as picked up?",
        answer: "In the Ongoing tab, select the checkbox in the Mark as Picked Up column to indicate the Cargo Unit has been picked up.",
    },
    {
        icon: CalendarPlus,
        question: "How do I schedule a pickup reservation?",
        answer: "In the Ongoing tab, there is a Reserve button for Cargo Units that do not yet have a pickup reservation created. Select the Reserve button to choose a reservation time that is sent to the Terminal Operator for approval.",
    },
    {
        icon: Pencil,
        question: "How do I modify a reservation?",
        answer: "In the Ongoing tab, select the pencil icon in the Modify Reservation column to make changes to the reservation for the respective Cargo Unit.",
    },
    {
        icon: CheckCircle,
        question: "How do I view completed pickups?",
        answer: "Select the Completed tab to view previously picked up Cargo Units and the date of the pickup.",
    },
]

export const TransportationCoordinatorSelfHelp = () => <SelfHelpPanel items={items} />
