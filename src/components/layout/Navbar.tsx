import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, User, ChevronDown, LogOut } from 'lucide-react';

const Navbar: React.FC<{ pageTitle?: string }> = ({ pageTitle = 'Dashboard' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header className="gov-header fixed top-0 left-[240px] right-0 z-40 h-[64px] bg-white border-b border-[#E5E7EB] shadow-sm flex items-center px-6">
      {/* Page Title */}
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-[#1E293B]">{pageTitle}</h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">3</span>
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button 
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <div className="w-10 h-10 bg-[#1E3A8A] rounded-full flex items-center justify-center text-white font-bold text-sm">
              {userInitial}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{user?.role || 'Admin'}</p>
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
                <p className="text-sm text-gray-500">{user?.email || 'admin@trlm.gov.in'}</p>
              </div>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
