import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Map,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import { getRoleLabel, isBlockStaff, isDistrictStaff, isStateAdmin } from '../../utils/roleAccess';

const CRP_NAV_ITEMS = {
  admin: [
    { path: '/crp/list', label: 'CRP Management', icon: Map },
  ],
  district: [
    { path: '/crp/list', label: 'CRP Management', icon: Map },
  ],
  block: [
    { path: '/crp/approval', label: 'CRP Approval', icon: ShieldCheck },
    { path: '/crp/create', label: 'Create CRP', icon: Users },
    { path: '/crp/list', label: 'CRP Management', icon: Map },
  ],
} as const;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();

  const isActive = (path: string) => location.pathname.startsWith(path);

  const menuSections = React.useMemo(() => {
    if (isStateAdmin(user)) {
      return [
        {
          label: 'Overview',
          items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
        },
        {
          label: 'Administration',
          items: [
            { path: '/staff/approval', label: 'Staff Approval', icon: ShieldCheck },
            { path: '/staff/users', label: 'All Users', icon: Users },
            { path: '/staff/create-user', label: 'Create User', icon: Users },
            ...CRP_NAV_ITEMS.admin,
            { path: '/reports', label: 'Reports', icon: BarChart3 },
          ],
        },
      ];
    }

    if (isDistrictStaff(user)) {
      return [
        {
          label: 'Overview',
          items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
        },
        {
          label: 'Management',
          items: [
            ...CRP_NAV_ITEMS.district,
            { path: '/reports', label: 'Reports', icon: BarChart3 },
          ],
        },
      ];
    }

    if (isBlockStaff(user)) {
      return [
        {
          label: 'Overview',
          items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
        },
        {
          label: 'Operations',
          items: [
            ...CRP_NAV_ITEMS.block,
            { path: '/reports', label: 'Reports', icon: BarChart3 },
          ],
        },
      ];
    }

    return [
      {
        label: 'Overview',
        items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
      },
      {
        label: 'Administration',
        items: [
          { path: '/staff/approval', label: 'Staff Approval', icon: ShieldCheck },
          { path: '/staff/users', label: 'All Users', icon: Users },
          ...CRP_NAV_ITEMS.block,
          { path: '/reports', label: 'Reports', icon: BarChart3 },
        ],
      },
    ];
  }, [user]);

  const roleLabel = getRoleLabel(user?.roleId || user?.role || '');

  return (
    <aside className={`gov-sidebar${isMobileOpen ? ' is-mobile-open' : ''}`}>
      <div className="gov-sidebar__top">
        <div className="gov-sidebar__brand">
          <div className="gov-sidebar__brand-mark">
            <span>T</span>
          </div>
          {!isCollapsed && (
            <div className="gov-sidebar__brand-copy">
              <h2>TRLM Portal</h2>
              <p>Admin workspace</p>
            </div>
          )}
        </div>

        <button
          className="gov-sidebar__toggle"
          onClick={toggleCollapse}
          type="button"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <div className="gov-sidebar__profile">
        <div className="gov-sidebar__profile-avatar">
          {isStateAdmin(user) ? 'SA' : isDistrictStaff(user) ? 'DS' : 'BS'}
        </div>
        {!isCollapsed && (
          <div className="gov-sidebar__profile-copy">
            <span className="gov-sidebar__profile-label">Active Role</span>
            <strong>{roleLabel}</strong>
            <span className="gov-sidebar__profile-subtitle">
              {user?.districtName || user?.blockName || 'Portal management'}
            </span>
          </div>
        )}
      </div>

      <nav className="gov-sidebar__nav" aria-label="Primary navigation">
        {menuSections.map((section) => (
          <div className="gov-sidebar__section" key={section.label}>
            {!isCollapsed && <p className="gov-sidebar__section-label">{section.label}</p>}
            <div className="gov-sidebar__links">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`gov-sidebar__link${active ? ' is-active' : ''}`}
                    onClick={closeMobile}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="gov-sidebar__link-icon">
                      <Icon size={18} />
                    </span>
                    {!isCollapsed && <span className="gov-sidebar__link-text">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="gov-sidebar__footer">
        <button
          className="gov-sidebar__signout"
          type="button"
          onClick={() => {
            logout();
            closeMobile();
            navigate('/login');
          }}
        >
          <LogOut size={18} />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
