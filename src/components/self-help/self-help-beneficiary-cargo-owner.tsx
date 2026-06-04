import { Package, UserPlus, Phone, History } from "lucide-react"
import { SelfHelpPanel, SelfHelpItem } from "./self-help-panel"

const items: SelfHelpItem[] = [
    {
        icon: Package,
        question: "How do I view the status of cargo?",
        answer: "The home page contains all Cargo Units, which are separated into three tabs based on status: Upcoming, Ongoing, and Completed. Select the appropriate tab to view the respective Cargo Units.",
    },
    {
        icon: UserPlus,
        question: "How do I assign a Transportation Coordinator for cargo?",
        answer: "In the Upcoming tab, Cargo Units that have not been assigned to a Transportation Coordinator will appear. Once the Cargo Unit status is updated to On-Dock by the Terminal Operator, the Assign button becomes available to assign a Transportation Coordinator for the Cargo Unit.",
    },
    {
        icon: Phone,
        question: "How do I contact a Transportation Coordinator for an assigned cargo pickup?",
        answer: "In the Ongoing tab there is a Contact button for each Cargo Unit that can be used to contact the Transportation Coordinator for assigned pickups.",
    },
    {
        icon: History,
        question: "How do I view a history of completed cargo pickups?",
        answer: "Select the Completed tab to view previously picked up Cargo Units and the date of the pickup.",
    },
]

export const BeneficiaryCargoOwnerSelfHelp = () => <SelfHelpPanel items={items} />
