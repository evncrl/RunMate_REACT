import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../css/Topbar.css';

export default function Topbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="topbar">
      <h2 className="topbar-title">Admin Dashboard</h2>
      <div className="topbar-user">
        <span className="topbar-user-name">
          {currentUser?.name || currentUser?.email || 'Admin User'}
        </span>
        {currentUser?.photo ? (
          <img
            src={currentUser.photo}
            alt="Profile"
            className="topbar-user-avatar"
          />
        ) : (
          <div className="topbar-user-avatar-placeholder">
            {(currentUser?.name || currentUser?.email || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <button onClick={handleLogout} className="topbar-logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
}
  