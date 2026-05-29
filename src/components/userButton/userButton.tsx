
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Selfhelp } from '../self-help/self-help';
import SettingsButton from '../settings/settingsButton';
import { Bell, Mail } from "lucide-react"
import './userButtonStyles.css';

interface UserButtonProps {
  fullName: string;
  role: string;
}

// Notifications and Messages buttons: when adding logic for red badges use width classes 
// below in terenary statements to adjust button width when displaying a badge

const UserButton: React.FC<UserButtonProps> = ({ fullName, role }) => {
    return (
    <>
        <Selfhelp />
        <Button variant="ghost" size="icon" className="gap-0 w-auto min-w-9 max-w-11 [&_svg]:size-5">
            <Mail />
            <span className="sr-only">Open Messages</span>
            <Badge variant="destructive" className="self-start h-2 w-2 rounded-full mt-0 p-0 flex items-center justify-center text-[10px]">
                <span className="sr-only">New Message</span>
            </Badge>
        </Button>
        <Button variant="ghost" size="icon" className="gap-0 w-auto min-w-9 max-w-11 [&_svg]:size-5">
            <Bell />
            <span className="sr-only">Open Notifications</span>
            <Badge variant="destructive" className="self-start h-2 w-2 rounded-full mt-0 p-0 flex items-center justify-center text-[10px]">
                <span className="sr-only">New Notification</span>
            </Badge>
        </Button>
        <SettingsButton role={role} />
        <div className="user-button">
            <div className="user-button-content">
                <span>{fullName}</span>
                <span className="user-role">{role}</span>
            </div>
            <div className="user-avatar"></div>
            <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-gray-500 text-white text-lg font-bold">J</AvatarFallback>
            </Avatar>
        </div>
    </>
    );
};

export default UserButton;
