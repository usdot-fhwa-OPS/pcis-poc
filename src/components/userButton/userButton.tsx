import { ChevronDown } from 'lucide-react';
import './userButtonStyles.css';

interface UserButtonProps {
  fullName: string;
  role: string;
}

const UserButton: React.FC<UserButtonProps> = ({ fullName, role }) => {
    return (
        <button className="user-button">
            <ChevronDown size={20} />
            <div className="user-button-content">
            <span>{fullName}</span>
            <span className="user-role">{role}</span>
            </div>
            <div className="user-avatar"></div>
        </button>
    );
};

export default UserButton;
