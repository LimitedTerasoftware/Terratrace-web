import React, { useState, ReactNode } from 'react';
import Header from '../components/Header/index';
import Sidebar from '../components/Sidebar/index';

const DefaultLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
    
  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex h-screen overflow-hidden">
        {/* <!-- ===== Sidebar Start ===== --> */}
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        {/* <!-- ===== Sidebar End ===== --> */}
         
        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* <!-- ===== Header Start ===== --> */}
                      
          {/*<Header sidebarOpen={sidebarOpen} />*/}
                               
          {/* <!-- ===== Header End ===== --> */}
           
          {/* <!-- ===== Main Content Start ===== --> */}
          <main 
             className={`transition-all duration-300
               ${sidebarOpen ? 'lg:ml-64' : 'md:ml-18'}
              `}
          >
            {/* Reduced gap between header and main content by using separate padding classes */}
            {/* Changed from: p-4 md:p-6 2xl:p-10 to separate px/pt/pb for better control */}
            <div className="mx-auto max-w-screen-2xl px-4 pt-2 pb-4 md:px-6 md:pt-2 md:pb-6 2xl:px-10 2xl:pt-4 2xl:pb-10">
              {children}
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </div>
  );
};

export default DefaultLayout;