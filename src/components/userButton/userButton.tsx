
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Selfhelp } from '../self-help/self-help';
import SettingsButton from '../settings/settingsButton';
import './userButtonStyles.css';

interface UserButtonProps {
  fullName: string;
  role: string;
}

const UserButton: React.FC<UserButtonProps> = ({ fullName, role }) => {
    return (
    <>
        <Selfhelp />
        <SettingsButton role={role} />
        <div className="user-button">
            <div className="user-button-content">
                <span>{fullName}</span>
                <span className="user-role">{role}</span>
            </div>
            <div className="user-avatar"></div>
            <Avatar color="gray">
                <AvatarFallback>J</AvatarFallback>
            </Avatar>
        </div>
    </>
    );
};

export default UserButton;
