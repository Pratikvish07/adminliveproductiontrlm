import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { getRoleLabel, getUserRoleId, ROLE_IDS } from '../../utils/roleAccess';

const Navbar: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { openMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [imageError, setImageError] = useState('');

  const pageMeta = React.useMemo(() => {
    const routes = [
      { match: '/dashboard', title: 'Dashboard', subtitle: 'Track TRLM operations and quick summaries.' },
      { match: '/staff/approval', title: 'Staff Approval', subtitle: 'Review and approve pending staff requests.' },
      { match: '/staff/users', title: 'All Users', subtitle: 'Inspect all users registered in the portal.' },
      { match: '/crp/approval', title: 'CRP Approval', subtitle: 'Validate pending CRP records and workflow.' },
      { match: '/crp/create', title: 'Create CRP', subtitle: 'Register a new Community Resource Person record.' },
      { match: '/crp/list', title: 'CRP List', subtitle: 'Browse all Community Resource Person records.' },
      { match: '/payment/loan-tracking', title: 'Loan Tracking', subtitle: 'Monitor disbursement and repayment flow.' },
      { match: '/payment/loan-approval', title: 'Loan Approval', subtitle: 'Review loan approvals waiting for action.' },
      { match: '/payment/payments', title: 'Payments', subtitle: 'Check payment records and status updates.' },
      { match: '/reports', title: 'Reports', subtitle: 'Review Excel-style SHG member farm activity report data.' },
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
  const roleId = getUserRoleId(user);
  const userInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';
  const profileMeta = [
    { label: 'Role', value: roleLabel || 'Administrator' },
    { label: 'Tracker ID', value: user?.livelihoodTrackerId || user?.id || '-' },
    ...(roleId === ROLE_IDS.DISTRICT_STAFF
      ? [{ label: 'District', value: user?.districtName || user?.districtId || '-' }]
      : []),
    ...(roleId === ROLE_IDS.BLOCK_STAFF
      ? [
          { label: 'District', value: user?.districtName || user?.districtId || '-' },
          { label: 'Block', value: user?.blockName || user?.blockId || '-' },
        ]
      : []),
  ];

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setImageError('Unable to read the selected image.');
        return;
      }

      setImageError('');
      updateUser((current) => current ? { ...current, profileImage: result } : current);
    };
    reader.onerror = () => {
      setImageError('Unable to read the selected image.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

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
                  <div className="gov-navbar__dropdown-avatar-wrap">
                    {user?.profileImage ? (
                      <img src={user.profileImage} alt={displayName} className="gov-navbar__dropdown-avatar-image" />
                    ) : (
                      <div className="gov-navbar__dropdown-avatar">{userInitials}</div>
                    )}
                    <label className="gov-navbar__dropdown-upload">
                      <input type="file" accept="image/*" onChange={handleImageChange} />
                      {user?.profileImage ? 'Change Image' : 'Upload Image'}
                    </label>
                  </div>
                  <div className="gov-navbar__dropdown-identity">
                    <p>{displayName}</p>
                    <span>{user?.email || user?.livelihoodTrackerId || '-'}</span>
                  </div>
                </div>
                {imageError && <p className="gov-navbar__dropdown-error">{imageError}</p>}
                <div className="gov-navbar__dropdown-meta">
                  {profileMeta.map((item) => (
                    <div className="gov-navbar__dropdown-meta-item" key={item.label}>
                      <label>{item.label}</label>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
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
