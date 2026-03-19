import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, Users, Building2, FileText, CreditCard, Settings, LogOut, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleLinkClick();
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLinkClick = () => {
    if (isMobileOpen) {
      closeMobile();
    }
  };

  const mainMenus = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, title: 'Dashboard' },
    { path: '/master/filter', label: 'Master Data', icon: Database, title: 'Master Data' },
    { path: '/shg/list', label: 'SHG', icon: Building2, title: 'SHG' },
    { path: '/payment/loan-tracking', label: 'Payments', icon: CreditCard, title: 'Payments' },
    { path: '/staff/users', label: 'Settings', icon: Settings, title: 'Settings' },
  ];

  const staffMenus = [
    { path: '/staff', label: 'Approval', icon: null },
    { path: '/staff/users', label: 'All Users', icon: null },
  ];

  const crpMenus = [
    { path: '/crp/approval', label: 'Approval', icon: null },
    { path: '/crp/list', label: 'List', icon: null },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`} onClick={closeMobile} />
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <button className="sidebar-toggle" onClick={toggleCollapse} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <nav className="sidebar-nav">
          {mainMenus.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={handleLinkClick}
              title={isCollapsed ? item.title : ''}
            >
              {React.createElement(item.icon as any, { size: 22 })} 
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
          
          <div className="nav-group">
            <span>Staff / Users</span>
            {staffMenus.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item sub ${isActive(item.path) ? 'active' : ''}`}
                onClick={handleLinkClick}
                title={isCollapsed ? item.label : ''}
              >
                <Users size={18} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>

          <div className="nav-group">
            <span>CRP</span>
            {crpMenus.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item sub ${isActive(item.path) ? 'active' : ''}`}
                onClick={handleLinkClick}
                title={isCollapsed ? item.label : ''}
              >
                <FileText size={18} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>

          <div className="nav-item" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', marginLeft: '1rem', marginRight: '1rem', paddingTop: '1rem' }}>
            <button
              className="nav-item"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={22} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
