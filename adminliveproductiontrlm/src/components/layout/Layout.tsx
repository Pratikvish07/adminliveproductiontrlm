import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const LayoutShell: React.FC = () => {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

  return (
    <div
      className={[
        'gov-app-shell',
        isCollapsed ? 'is-collapsed' : '',
        isMobileOpen ? 'is-mobile-open' : '',
      ].filter(Boolean).join(' ')}
    >
      <Sidebar />
      <div
        className={`gov-sidebar-overlay${isMobileOpen ? ' is-visible' : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />
      <div className="gov-content-shell">
        <Navbar />
        <main className="gov-main">
          <div className="gov-main-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

const Layout: React.FC = () => (
  <SidebarProvider>
    <LayoutShell />
  </SidebarProvider>
);

export default Layout;
