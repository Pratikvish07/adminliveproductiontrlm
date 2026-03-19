import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '../../context/SidebarContext';

const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="layout">
        <Navbar />
        <div className="layout-body">
          <Sidebar />
          <main className="layout-main">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
