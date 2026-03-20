import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, CreditCard, ChevronRight, ChevronLeft, LogOut } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, toggleCollapse } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/staff', label: 'Staff', icon: Users },
    { path: '/shg', label: 'SHG', icon: Building2 },
    { path: '/payment', label: 'Payments', icon: CreditCard },
  ];

  return (
    <aside className="gov-sidebar fixed left-0 top-0 h-screen w-[240px] bg-gradient-to-b from-[#1E3A8A] to-[#1E40AF] shadow-2xl z-30 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          {!isCollapsed && <div>
            <h2 className="text-white font-bold text-xl">TRLM Portal</h2>
            <p className="text-white/80 text-sm">Admin Dashboard</p>
          </div>}
        </div>
      </div>

      {/* Toggle */}
      <button 
        className="absolute top-20 right-2 p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all z-40"
        onClick={toggleCollapse}
      >
        {isCollapsed ? <ChevronRight size={20} className="text-white" /> : <ChevronLeft size={20} className="text-white" />}
      </button>

      {/* Menu */}
      <nav className="flex-1 mt-24 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`gov-nav-item flex items-center gap-3 p-3 rounded-xl transition-all group ${isActive(item.path) ? 'bg-white/20 border-l-4 border-white' : 'hover:bg-white/10'}`}
          >
            <item.icon size={20} className={`text-white/90 group-hover:text-white shrink-0`} />
            {!isCollapsed && <span className="text-white font-medium whitespace-nowrap">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Sticky Sign Out */}
      <div className="p-4 border-t border-white/20 mt-auto bg-black/20">
        <button 
          className="w-full flex items-center gap-3 p-3 rounded-xl text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-all text-left"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
