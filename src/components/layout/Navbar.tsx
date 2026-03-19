import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronDown, Menu, Building2 } from 'lucide-react';


const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header className="navbar">
      {/* Left: Logo & App Title */}
      <div className="navbar-left">
        <button className="navbar-hamburger" aria-label="Toggle sidebar">
          <Menu size={24} />
        </button>
        <div className="navbar-logo">
          <Building2 size={32} className="navbar-logo-icon" />
          <span className="navbar-title">TRLM Portal</span>
        </div>
      </div>

      {/* Center: Breadcrumbs/Search (optional, stub for now) */}
      <div className="navbar-center">
        {/* Future: breadcrumbs */}
      </div>

      {/* Right: User Menu */}
      <div className="navbar-right">
        {isAuthenticated ? (
          <div className="navbar-user-container">
            <button className="navbar-user-btn" onClick={toggleUserMenu}>
              <div className="navbar-avatar">{userInitial}</div>
              <span className="navbar-user-name">{user?.name || 'User'}</span>
              <ChevronDown size={20} className={`navbar-chevron ${userMenuOpen ? 'rotated' : ''}`} />
            </button>
            {userMenuOpen && (
              <div className="navbar-user-menu">
                <div className="navbar-user-info">
                  <div className="navbar-avatar-large">{userInitial}</div>
                  <div>
                    <div className="navbar-user-name-md">{user?.name}</div>
                    <div className="navbar-user-role">{user?.role || 'Staff'}</div>
                  </div>
                </div>
                <button className="navbar-menu-item gov-btn gov-btn-danger" onClick={handleLogout}>
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <span className="navbar-guest">Guest</span>
        )}
      </div>
    </header>
  );
};

export default Navbar;

