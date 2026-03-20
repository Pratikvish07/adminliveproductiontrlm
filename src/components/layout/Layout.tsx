import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import { SidebarProvider } from '../../context/SidebarContext';

const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="gov-app min-h-screen bg-[#F8FAFC]">
        <Navbar />
        <div className="gov-layout-body flex min-h-[calc(100vh-72px)]">
          <Sidebar />
          <main className="gov-main flex-1 p-6 lg:p-8 ml-[280px] transition-all duration-300 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
