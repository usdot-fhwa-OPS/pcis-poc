
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Selfhelp } from '../self-help/self-help';
import SettingsButton from '../settings/settingsButton';
import { Bell, Mail } from "lucide-react"
import './userHeaderStyles.css';

interface UserHeaderProps {
  fullName: string;
  role: string;
}

// Notifications and Messages buttons: when adding logic for red badges use width classes 
// below in terenary statements with w-9 to adjust button width when displaying a badge

const UserHeader: React.FC<UserHeaderProps> = ({ fullName, role }) => {
    
    const initial = fullName.charAt(0).toUpperCase();

    // Generate background color based on length of fullName
    // Use HSL to maintain consistent vibrance and contrast  
    const getAvatarColor = (fullName: string) => {

        let hash = 0;
        for (let i = 0; i < fullName.length; i++) {
            hash = fullName.charCodeAt(i) + ((hash << 5) - hash);
        }

        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 60%, 55%)`
    };

    const bgColor = getAvatarColor(fullName);
    
    return (
    <>
        <div className="flex items-center justify-end gap-4 sm:gap-5 p-3 sm:pr-6 bg-white border-b mb-4">
            <Selfhelp />
            <Button variant="ghost" size="icon" className="gap-[0.125rem] w-[2.875rem] [&_svg]:size-5">
                <Mail />
                <span className="sr-only">Open Messages</span>
                <Badge variant="destructive" className="self-start h-2 w-2 rounded-full mt-1 p-0 shadow-none">
                    <span className="sr-only">New Message</span>
                </Badge>
            </Button>
            <Button variant="ghost" size="icon" className="gap-0 w-11 [&_svg]:size-5">
                <Bell />
                <span className="sr-only">Open Notifications</span>
                <Badge variant="destructive" className="self-start h-2 w-2 rounded-full mt-1 p-0 shadow-none">
                    <span className="sr-only">New Notification</span>
                </Badge>
            </Button>
            <SettingsButton role={role} />
            <div className="user-info">
                <div className="user-info-name">
                    <span>{fullName}</span>
                    <span className="user-info-role">{role}</span>
                </div>
                <Avatar className="h-9 w-9">
                    <AvatarFallback style={{ backgroundColor: bgColor }} className="text-white text-lg font-semibold">{initial}</AvatarFallback>
                </Avatar>
            </div>
        </div>
    </>
    );
};

export default UserHeader;
