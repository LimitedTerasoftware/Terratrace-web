import React, { useEffect, useRef, useState } from 'react';
import {NavLink, useLocation } from 'react-router-dom';
import { SideBarItem } from './NavLink';
import Tricad from '../../images/logo/Tricad.png';
import TricadLogo from '../../images/logo/favicon.png';
import RouteMap from '../../images/icon/route-map.svg';
import CompanyIcon from '../../images/icon/enterprise-svgrepo-com.svg';
import SurveyIcon from '../../images/icon/clipboard-with-a-list-svgrepo-com.svg';
import DashboardIcon from '../../images/icon/dashboard-svgrepo-com.svg'
import SidebarLinkGroup from './SidebarLinkGroup';
import User from '../../images/icon/user-icon.svg';
import TableIcon from '../../images/icon/table-icon.svg';
import Logo from '../../images/logo/logo.png';

import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const { pathname } = location;
  const trigger = useRef<any>(null);
  const sidebar = useRef<any>(null);

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true'
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !isOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      toggleSidebar();
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!isOpen || keyCode !== 27) return;
      toggleSidebar();
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  useEffect(() => {
    localStorage.setItem('sidebar-expanded', sidebarExpanded.toString());
    if (sidebarExpanded) {
      document.querySelector('body')?.classList.add('sidebar-expanded');
    } else {
      document.querySelector('body')?.classList.remove('sidebar-expanded');
    }
  }, [sidebarExpanded]);


  return (
    <aside
      className={`fixed left-0 top-0 z-9999 flex h-screen transition-all transform  bg-black duration-300 ease-linear dark:bg-boxdark 
          ${isOpen ? 'w-64' : 'w-16'}
          transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          
        `}
    >
     
      {/* Toggle Button */}

      <button
        onClick={toggleSidebar}
        className={`absolute -right-4 top-10 transform -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none shadow-md hover:shadow-lg transition-all duration-200`}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div className="h-full flex flex-col">
        {/* Logo */}
        <div className={`flex items-center h-16 px-4 ${isOpen ? 'justify-start' : 'justify-center'}`}>
          <div className="flex items-center">
            <NavLink
              to="/dashboard"
            >

              {!isOpen && (<img src={TricadLogo} alt="Logo" className="w-[30px] ml-[-1px]" />)}
              <span className={`ml-2 text-xl font-semibold ${isOpen ? 'block' : 'hidden'}`}>
                <img src={Tricad} alt="Logo" className="w-[180px]" />
              </span>
            </NavLink>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4">
          <h3 className={`mb-4 ${isOpen ? 'ml-4' : 'ml-0'}  text-sm font-semibold text-bodydark2`}>
            Menu
          </h3>

          <ul className="space-y-2">
            <SideBarItem icon={DashboardIcon} label="Dashboard" isOpen={isOpen} isActive={pathname === '/' || pathname.includes('dashboard')} path={pathname === '/' ? '/' : '/dashboard'}
            />
            <SideBarItem icon={CompanyIcon} label="Companies" isOpen={isOpen} isActive={pathname.includes('companies')} path='/companies' />
            <SideBarItem icon={User} label="Users" isOpen={isOpen} isActive={pathname.includes('users')} path='/users' />
            <SideBarItem icon={SurveyIcon} label="Survey" isOpen={isOpen} isActive={pathname.includes('survey')} path='/survey' />
            <SideBarItem icon={User} label="KML File Upload" isOpen={isOpen} isActive={pathname.includes('kmlfileupload')} path='/kmlfileupload' />
            <li>
              <NavLink
                // to="http://traceapi.keeshondcoin.com/"
                to="/route-planning"
                target="_blank"  // This will open the link in a new tab
                rel="noopener noreferrer"  // Security best practice when opening in a new tab
                className={`
                      flex items-center py-2 px-3 rounded-lg transition-colors duration-200
                     text-bodydark1 
                    
                    `}
              >
                <div className="min-w-[24px] flex justify-center">
                  <img src={RouteMap} alt={"RouteMap"} className="w-5 h-5 object-contain" />

                </div>
                <span className={`ml-3 ${isOpen ? 'block' : 'hidden'}`}>Route Planning</span>
              </NavLink>
            </li>
          </ul>
        </div>
        <div className="flex-1 px-3 py-4">
          <h3 className={`mb-4 ${isOpen ? 'ml-4' : 'ml-0'}  text-sm font-semibold text-bodydark2`}>
            Masters
          </h3>
          <ul className="space-y-2">


            <SidebarLinkGroup
              activeCondition={pathname === '/master' || pathname.includes('master')}
            >
              {(handleClick, open) => {
                return (
                  <React.Fragment>
                    <NavLink
                      to="#"
                      className={`
                        flex items-center justify-between py-2 px-3 rounded-lg transition-colors duration-200 text-bodydark1
                        ${(pathname === '/master' || pathname.includes('master'))
                                              ? 'bg-graydark dark:bg-meta-4'
                                              : 'hover:bg-graydark dark:hover:bg-meta-4'
                                            }
                      `}
                      onClick={(e) => {
                        e.preventDefault();
                        sidebarExpanded
                          ? handleClick()
                          : setSidebarExpanded(true);
                      }}

                    >
                      {/* Icon + Label */}
                      <div className="flex items-center gap-3">
                        <div className="min-w-[24px] flex justify-center">
                          <img src={TableIcon} alt="RouteMap" className="w-5 h-5 object-contain" />
                        </div>
                        {isOpen && <span>Tables</span>}
                      </div>

                      {/* Arrow */}
                      {isOpen && (
                        open
                          ? <ChevronUp className="w-4 h-4 text-gray-500" />
                          : <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </NavLink>

                    {/* <!-- Dropdown Menu Start --> */}
                    {isOpen && (
                    <div
                      className={`translate transform overflow-hidden ${!open && 'hidden'
                        }`}
                    >
                      <ul className="space-y-2 mb-5.5 mt-4 flex flex-col gap-2.5 pl-6">
                        <li>
                          <NavLink
                            to="/master/states"

                            className={({ isActive }) =>
                              'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                              (isActive && '!text-white')
                            }
                          >
                            States
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/master/district"
                            className={({ isActive }) =>
                              'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                              (isActive && '!text-white')
                            }
                          >
                            Districts
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/master/blocks"
                            className={({ isActive }) =>
                              'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                              (isActive && '!text-white')
                            }
                          >
                            Blocks
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/master/gpslist"
                            className={({ isActive }) =>
                              'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                              (isActive && '!text-white')
                            }
                          >
                            Gp List
                          </NavLink>
                        </li>
                      </ul>
                    </div>
                    )}
                    {/* <!-- Dropdown Menu End --> */}
                  </React.Fragment>
                );
              }}
            </SidebarLinkGroup>

          </ul>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;
