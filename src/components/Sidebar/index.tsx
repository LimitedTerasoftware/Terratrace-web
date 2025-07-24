// index.tsx - Sidebar with imported DropdownUser component
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
import { hasViewOnlyAccess } from "../../utils/accessControl";
import DropdownUser from './DropDownUser'; // Import the dropdownuser component
import DarkModeSwitcher from './DarkModeSwitcher'; // Import the dark mode switcher
import KML from '../../images/icon/kml-file.svg';
import Smart_Inv from '../../images/icon/internet-world-svgrepo-com.svg';
import Machine from '../../images/icon/mechine.svg';
import Other from '../../images/logo/dashboard-4-svgrepo-com.svg';
import ConstructionImg from '../../images/icon/construction-worker.svg'

import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ListCollapse,        // Icon for Route List
  MapPinHouse,        // Icon for Route Builder
  ClipboardMinus,      // Icon for Reports
  Logs,  // Icon for Audit Logs
  Cog,
  LocateFixed,
  Building,
  User2Icon
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
  const viewOnly = hasViewOnlyAccess();


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
          ${isOpen ? 'w-64' : 'w-18'}
          transform
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          
        `}
    >

      {/* Toggle Button */}

      <button
        onClick={toggleSidebar}
        className={`absolute -right-4 top-10 transform -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none shadow-md hover:shadow-lg transition-all duration-200`}
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
            {!viewOnly && (
              <>
                {/* <SideBarItem icon={CompanyIcon} label="Companies" isOpen={isOpen} isActive={pathname.includes('companies')} path='/companies' />
               <SideBarItem icon={User} label="Users" isOpen={isOpen} isActive={pathname.includes('users')} path='/users' /> */}
                <SideBarItem icon={SurveyIcon} label="Survey" isOpen={isOpen} isActive={pathname.includes('survey')} path='/survey' />
                <SideBarItem icon={ConstructionImg} label="Construction" isOpen={isOpen} isActive={pathname.includes('construction')} path='/construction' />
                <SidebarLinkGroup activeCondition={pathname.includes('machine-management')}>
                  {(handleClick, open) => {
                    return (
                      <>
                        <NavLink
                          to="#"
                          className={`
                              flex items-center justify-between py-2 ${isOpen ? 'px-3' : 'px-2'} rounded-lg transition-colors duration-200 text-bodydark1
                              ${pathname.includes('machine-management')
                              ? 'bg-graydark dark:bg-meta-4'
                              : 'hover:bg-graydark dark:hover:bg-meta-4'}
                              ${!isOpen ? 'w-[44px]' : 'w-full'}
                            `}
                          onClick={(e) => {
                            e.preventDefault();
                            sidebarExpanded ? handleClick() : setSidebarExpanded(true);
                          }}
                        >
                          {/* Icon + Label */}
                          <div className={`flex items-center ${isOpen ? 'gap-3' : 'gap-0'} w-full`}>
                            <div className="min-w-[20px] flex justify-center">
                              <img src={Machine} alt="MachMgmt" className="w-5 h-5 object-contain" />
                            </div>
                            {isOpen && <span className="whitespace-nowrap">Machine Mgmt</span>}
                          </div>

                          {isOpen && (
                            open
                              ? <ChevronUp className="w-4 h-4 text-gray-500" />
                              : <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </NavLink>


                        <div className={`transform overflow-hidden transition-all ${!open && 'hidden'}`}>
                          <ul className="space-y-2 mt-4 flex flex-col gap-2.5 pl-6">
                            <li>
                              <NavLink
                                to="/machine-management/machines"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-2 py-1 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white 
                                      ${isActive ? '!text-white' : ''}`
                                }
                              >
                                <Cog size={16} className="min-w-[16px]" />
                                <span className={isOpen ? '' : 'hidden'}>Machines</span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink
                                to="/machine-management/machine-tracking"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-2 py-1 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white 
                                      ${isActive ? '!text-white' : ''}`
                                }
                              >
                                <LocateFixed size={16} className="min-w-[16px]" />
                                <span className={isOpen ? '' : 'hidden'}>Machine Tracking</span>
                              </NavLink>
                            </li>
                          </ul>
                        </div>

                      </>
                    );
                  }}
                </SidebarLinkGroup>

                <SidebarLinkGroup
                  activeCondition={pathname.includes('route-planning')}
                >
                  {(handleClick, open) => {
                    return (
                      <React.Fragment>
                        <NavLink
                          to="#"
                          className={`
                              flex items-center justify-between py-2 ${isOpen ? 'px-3' : 'px-2'} rounded-lg transition-colors duration-200 text-bodydark1
                        ${pathname.includes('route')
                              ? 'bg-graydark dark:bg-meta-4'
                              : 'hover:bg-graydark dark:hover:bg-meta-4'
                            } ${!isOpen ? 'w-[44px]' : 'w-full'}
                      `}
                          onClick={(e) => {
                            e.preventDefault();
                            sidebarExpanded
                              ? handleClick()
                              : setSidebarExpanded(true);
                          }}
                        >
                          {/* Icon + Label */}
                          <div className={`flex items-center ${isOpen ? 'gap-3' : 'gap-0'} w-full`}>
                            <div className="min-w-[20px] flex justify-center">
                              <img src={RouteMap} alt="RouteMap" className="w-5 h-5 object-contain" />
                            </div>
                            {isOpen && <span className="whitespace-nowrap" >Route Planning</span>}
                          </div>

                          {isOpen && (
                            open
                              ? <ChevronUp className="w-4 h-4 text-gray-500" />
                              : <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </NavLink>


                        <div
                          className={`translate transform overflow-hidden ${!open && 'hidden'}`}
                        >
                          <ul className="space-y-2 mt-4 flex flex-col gap-2.5 pl-6">
                            <li>
                              <NavLink
                                to="/route-planning/route-list"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-2 py-1 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white 
                                      ${isActive ? '!text-white' : ''}`
                                }
                              >
                                <ListCollapse size={16} className="min-w-[16px]" />
                                <span className={isOpen ? '' : 'hidden'}>Route List</span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink
                                to="/route-planning/builder"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-2 py-1 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white 
                                      ${isActive ? '!text-white' : ''}`
                                }
                              >
                                <MapPinHouse size={16} className="min-w-[16px]" />
                                <span className={isOpen ? '' : 'hidden'}>Route Builder</span>
                              </NavLink>
                            </li>
                            {/* Option 3: Reports - internal link
                          <li>
                            <NavLink
                              to="/route-planning/reports"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              <ClipboardMinus size={16} className="min-w-[16px]" />
                              Reports
                            </NavLink>
                          </li> */}
                            {/* Option 4: Audit Logs - internal link */}
                            {/*<li>
                            <NavLink
                              to="/route-planning/audit-logs"
                              className={({ isActive }) =>
                                'group relative flex items-center gap-2.5 rounded-md px-4 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white ' +
                                (isActive && '!text-white')
                              }
                            >
                              <Logs size={16} className="min-w-[16px]" />
                              Audit Logs
                            </NavLink>
                          </li>*/}
                          </ul>
                        </div>

                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>
                <li>
                  <NavLink
                    to="/smart-inventory"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                          flex items-center py-2 ${isOpen ? 'px-3 gap-4' : 'px-2 gap-0'} rounded-lg 
                          transition-colors duration-200 text-bodydark1 hover:bg-graydark dark:hover:bg-meta-4
                          ${!isOpen ? 'w-[44px] justify-center' : ''}
                        `}
                  >
                    <img src={Smart_Inv} className="w-5" alt="Smart Inventory" />
                    {isOpen && <span className="whitespace-nowrap">Smart Inventory</span>}
                  </NavLink>
                </li>
                <SideBarItem icon={KML} label="Filter GP Points" isOpen={isOpen} isActive={pathname.includes('gp-points-filter')} path='/gp-points-filter' />
                <SidebarLinkGroup
                  activeCondition={pathname.includes('managementlist')}
                >
                  {(handleClick, open) => {
                    return (
                      <React.Fragment>
                        <NavLink
                          to="#"
                          className={`
                              flex items-center justify-between py-2 ${isOpen ? 'px-3' : 'px-2'} rounded-lg transition-colors duration-200 text-bodydark1
                              ${pathname.includes('managementlist')
                              ? 'bg-graydark dark:bg-meta-4'
                              : 'hover:bg-graydark dark:hover:bg-meta-4'}
                              ${!isOpen ? 'w-[44px]' : 'w-full'}
                            `}
                          onClick={(e) => {
                            e.preventDefault();
                            sidebarExpanded
                              ? handleClick()
                              : setSidebarExpanded(true);
                          }}
                        >
                          {/* Icon + Label */}
                          <div className={`flex items-center ${isOpen ? 'gap-3' : 'gap-0'} w-full`}>
                            <div className="min-w-[20px] flex justify-center">
                              <img src={TableIcon} alt="ManagementList" className="w-5 h-5 object-contain" />
                            </div>
                            {isOpen && <span className='whitespace-nowrap'>ManagementList</span>}
                          </div>

                          {isOpen && (
                            open
                              ? <ChevronUp className="w-4 h-4 text-gray-500" />
                              : <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </NavLink>


                        <div
                          className={`transform overflow-hidden transition-all ${!open && 'hidden'}`}
                        >
                          <ul className="space-y-2 mt-4 flex flex-col gap-2.5 pl-6">
                            <li>
                              <NavLink
                                to="/managementlist/companies"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-2 py-1 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white 
                                      ${isActive ? '!text-white' : ''}`
                                }
                              >
                                <Building size={16} className="min-w-[16px]" />
                                <span className={isOpen ? '' : 'hidden'}>Companies</span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink
                                to="/managementlist/users"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-2 py-1 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white 
                                      ${isActive ? '!text-white' : ''}`
                                }
                              >
                                <User2Icon size={16} className="min-w-[16px]" />
                                <span className={isOpen ? '' : 'hidden'}>Users</span>
                              </NavLink>
                            </li>

                          </ul>
                        </div>

                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>
              </>
            )}
            {!viewOnly && (
              <>
                {/* <SideBarItem icon={User} label="KML File Upload" isOpen={isOpen} isActive={pathname.includes('kmlfileupload')} path='/kmlfileupload' /> */}

              </>
            )}
          </ul>
        </div>
        {/* <div className="flex-1 px-3 py-2">
          <h3 className={`mb-2 ${isOpen ? 'ml-4' : 'ml-0'}  text-sm font-semibold text-bodydark2`}>
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
                     
                      <div className="flex items-center gap-3">
                        <div className="min-w-[24px] flex justify-center">
                          <img src={TableIcon} alt="RouteMap" className="w-5 h-5 object-contain" />
                        </div>
                        {isOpen && <span>Tables</span>}
                      </div>

                    
                      {isOpen && (
                        open
                          ? <ChevronUp className="w-4 h-4 text-gray-500" />
                          : <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </NavLink>

                    
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
                    
                  </React.Fragment>
                );
              }}
            </SidebarLinkGroup>

          </ul>
        </div> */}

        {/* Profile Section and Dark Mode Toggler at Bottom */}
        <div className="px-2 pb-4 mt-auto">
          <div className="flex items-center gap-4">
            {/* Profile Dropdown - Takes up most of the space with more width */}
            <div className="flex-1 min-w-0">
              <DropdownUser isOpen={isOpen} />
            </div>

            {/* Compact Dark Mode Switcher - Small fixed width on the right */}
            {isOpen && (
              <div className="flex-shrink-0">
                <ul>
                  <DarkModeSwitcher />
                </ul>
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
};

export default Sidebar;