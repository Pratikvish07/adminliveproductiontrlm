import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { getRoleLabel } from '../../utils/roleAccess';

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
      { match: '/master/gram-panchayat', title: 'Gram Panchayats', subtitle: 'View gram panchayat master records.' },
      { match: '/master/village', title: 'Villages', subtitle: 'Navigate village-level master data.' },
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

  const displayName = user?.name || user?.livelihoodTrackerId || 'Admin';
  const roleLabel = getRoleLabel(user?.roleId || user?.role || '');
  const userInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

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
            aria-expanded={userMenuOpen}
            aria-label="Open profile menu"
          >
            <div className="gov-navbar__avatar-wrap">
              <div className="gov-navbar__avatar">{userInitials}</div>
              <span className="gov-navbar__avatar-status" aria-hidden="true" />
            </div>
            <div className="gov-navbar__user-copy">
              <p>{displayName}</p>
              <span>{user?.livelihoodTrackerId || roleLabel || 'Administrator'}</span>
            </div>
            <ChevronDown size={16} className={`gov-navbar__chevron${userMenuOpen ? ' is-open' : ''}`} />
          </button>

          {userMenuOpen && (
            <div className="gov-navbar__dropdown">
              <div className="gov-navbar__dropdown-head">
                <div className="gov-navbar__dropdown-profile">
                  <div className="gov-navbar__dropdown-avatar">{userInitials}</div>
                  <div className="gov-navbar__dropdown-identity">
                    <p>{displayName}</p>
                    <span>{user?.email || 'admin@trlm.gov.in'}</span>
                  </div>
                </div>
                <div className="gov-navbar__dropdown-meta">
                  <div className="gov-navbar__dropdown-meta-item">
                    <label>Role</label>
                    <strong>{roleLabel || 'Administrator'}</strong>
                  </div>
                  <div className="gov-navbar__dropdown-meta-item">
                    <label>Tracker ID</label>
                    <strong>{user?.livelihoodTrackerId || user?.id || '-'}</strong>
                  </div>
                </div>
              </div>
              <button className="gov-navbar__dropdown-item" onClick={handleLogout} type="button">
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
