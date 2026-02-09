
import { Selfhelp } from '../self-help/self-help';
import SettingsButton from '../settings/settingsButton';
import { terminalCapacityList } from '../terminal-capacity/terminal-capacity-client';
import './userButtonStyles.css';

interface UserButtonProps {
  fullName: string;
  role: string;
  limit: number;
}

const UserButton: React.FC<UserButtonProps> = ({ fullName, role, limit }) => {
    let tcl = terminalCapacityList();
    return (
        <>
        <button className="user-button">
            <Selfhelp />
            <SettingsButton role={role} limit={limit} />
            <div className="user-button-content">
            <span>{fullName}</span>
            <span className="user-role">{role}</span>
            </div>
            <div className="user-avatar"></div>
           
        </button>
         {tcl}</>
    );
};

export default UserButton;
