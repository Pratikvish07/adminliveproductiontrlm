import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { openMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const pageMeta = React.useMemo(() => {
    const routes = [
      { match: '/dashboard', title: 'Dashboard', subtitle: 'Track TRLM operations and quick summaries.' },
      { match: '/staff/approval', title: 'Staff Approval', subtitle: 'Review and approve pending staff requests.' },
      { match: '/staff/users', title: 'All Users', subtitle: 'Inspect all users registered in the portal.' },
      { match: '/crp/approval', title: 'CRP Approval', subtitle: 'Validate pending CRP records and workflow.' },
      { match: '/crp/list', title: 'CRP List', subtitle: 'Browse all Community Resource Person records.' },
      { match: '/crp/tracking', title: 'CRP Tracking', subtitle: 'Follow CRP status and field progress.' },
      { match: '/payment/loan-tracking', title: 'Loan Tracking', subtitle: 'Monitor disbursement and repayment flow.' },
      { match: '/payment/loan-approval', title: 'Loan Approval', subtitle: 'Review loan approvals waiting for action.' },
      { match: '/payment/payments', title: 'Payments', subtitle: 'Check payment records and status updates.' },
      { match: '/master/district', title: 'Districts', subtitle: 'Manage district-level master data.' },
      { match: '/master/block', title: 'Blocks', subtitle: 'Browse and maintain block master data.' },
      { match: '/master/gram-panchayat', title: 'Gram Panchayats', subtitle: 'View gram panchayat master records.' },
      { match: '/master/village', title: 'Villages', subtitle: 'Navigate village-level master data.' },
      { match: '/master/filter', title: 'Master Filter', subtitle: 'Jump quickly to master data sections.' },
    ];

    return routes.find((route) => location.pathname.startsWith(route.match)) ?? {
      title: 'Dashboard',
      subtitle: 'Track TRLM operations and quick summaries.',
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header className="gov-navbar">
      <div className="gov-navbar__title-wrap">
        <button
          className="gov-navbar__menu-button"
          type="button"
          onClick={openMobile}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="gov-navbar__eyebrow">TRLM Admin Portal</p>
          <h1>{pageMeta.title}</h1>
          <p className="gov-navbar__subtitle">{pageMeta.subtitle}</p>
        </div>
      </div>

      <div className="gov-navbar__actions">
        <button className="gov-navbar__icon-button" type="button" aria-label="Notifications">
          <Bell size={19} />
          <span className="gov-navbar__notification-badge">3</span>
        </button>

        <div className="gov-navbar__user-menu">
          <button
            className="gov-navbar__user-trigger"
            onClick={() => setUserMenuOpen((current) => !current)}
            type="button"
          >
            <div className="gov-navbar__avatar">{userInitial}</div>
            <div className="gov-navbar__user-copy">
              <p>{user?.name || 'Admin'}</p>
              <span>{user?.role || 'Administrator'}</span>
            </div>
            <ChevronDown size={16} />
          </button>

          {userMenuOpen && (
            <div className="gov-navbar__dropdown">
              <div className="gov-navbar__dropdown-head">
                <p>{user?.name || 'Admin User'}</p>
                <span>{user?.email || 'admin@trlm.gov.in'}</span>
              </div>
              <button className="gov-navbar__dropdown-item" onClick={handleLogout} type="button">
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
