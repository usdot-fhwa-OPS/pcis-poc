
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Selfhelp } from '../self-help/self-help';
import SettingsButton from '../settings/settingsButton';
import { Bell, Mail } from "lucide-react"
import './userButtonStyles.css';

interface UserButtonProps {
  fullName: string;
  role: string;
}

const UserButton: React.FC<UserButtonProps> = ({ fullName, role }) => {
    return (
    <>
        <Selfhelp />
        <Button variant="ghost" size="icon" className="[&_svg]:size-5">
            <Mail />
            <span className="sr-only">Open Messages</span>
        </Button>
        <Button variant="ghost" size="icon" className="[&_svg]:size-5">
            <Bell />
            <span className="sr-only">Open Notifications</span>
        </Button>
        <SettingsButton role={role} />
        <div className="user-button">
            <div className="user-button-content">
                <span>{fullName}</span>
                <span className="user-role">{role}</span>
            </div>
            <div className="user-avatar"></div>
            <Avatar>
                <AvatarFallback className="bg-gray-500 text-white text-lg font-bold">J</AvatarFallback>
            </Avatar>
        </div>
    </>
    );
};

export default UserButton;
