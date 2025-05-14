import React from 'react';
import Sidebar from './Sidebar';
import { useAppContext } from './AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isSidebarOpen } = useAppContext();
 

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-80' : 'ml-0'
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default Layout;