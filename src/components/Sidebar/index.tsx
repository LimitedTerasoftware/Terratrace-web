// index.tsx - Sidebar with Dashboard moved inside Dashboards dropdown
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
import { hasInvOnlyAccess, hasViewOnlyAccess, isIEUser} from "../../utils/accessControl";
import DropdownUser from './DropDownUser'; // Import the dropdownuser component
import DarkModeSwitcher from './DarkModeSwitcher'; // Import the dark mode switcher
import KML from '../../images/icon/kml-file.svg';
import Smart_Inv from '../../images/icon/internet-world-svgrepo-com.svg';
import Machine from '../../images/icon/mechine.svg';
import Other from '../../images/logo/dashboard-4-svgrepo-com.svg';
import ConstructionImg from '../../images/icon/construction-worker.svg'
import { matchPath } from 'react-router-dom';

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
  User2Icon,
  Globe2Icon,
  Settings,              // Icon for Installation
  Grid3X3,
  BarChart3,            // Icon for Dashboards group
  ClipboardCheck,       // Icon for Survey Dashboard
  HardHat,             // Icon for Construction Dashboard
  Wrench,              // Icon for Installation Dashboard
  TrendingUp,          // Icon for Executive Dashboard
  Calendar             // Icon for Daily Progress Report
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
  const InvOnly = hasInvOnlyAccess();
  const ieUser = isIEUser();
  

  const storedSidebarExpanded = localStorage.getItem('sidebar-expanded');
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === 'true'
  );
  
  const surveyMatch = matchPath({ path: "/survey/*" }, pathname);
  const constructionMatch = matchPath({ path: "/construction/*" }, pathname);
  const installationMatch = matchPath({ path: "/installation/*" }, pathname);


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
        {/* Logo - Fixed at top */}
        <div className={`flex items-center h-16 px-4 flex-shrink-0 ${isOpen ? 'justify-start' : 'justify-center'}`}>
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

        {/* Navigation Links - Scrollable */}
        <div className="flex-1 px-3 py-4 overflow-y-auto custom-scrollbar">
          <h3 className={`mb-4 ${isOpen ? 'ml-4' : 'ml-0'}  text-sm font-semibold text-bodydark2`}>
            Menu
          </h3>

          <ul className="space-y-2">
            {/* Dashboards Menu Group - Now includes Main Dashboard */}
            {!ieUser && (
            <SidebarLinkGroup activeCondition={pathname.includes('dashboards') || pathname === '/dashboard' || pathname === '/'}>
              {(handleClick, open) => {
                return (
                  <React.Fragment>
                    <NavLink
                      to="#"
                      className={`
                        flex items-center justify-between py-2 ${isOpen ? 'px-3' : 'px-2'} rounded-lg transition-colors duration-200 text-bodydark1
                        ${(pathname.includes('dashboards') || pathname === '/dashboard' || pathname === '/')
                          ? 'bg-graydark dark:bg-meta-4'
                          : 'hover:bg-graydark dark:hover:bg-meta-4'}
                        ${!isOpen ? 'w-[44px]' : 'w-full'}
                      `}
                      onClick={(e) => {
                        e.preventDefault();
                        sidebarExpanded ? handleClick() : setSidebarExpanded(true);
                      }}
                    >
                      <div className={`flex items-center ${isOpen ? 'gap-3' : 'gap-0'} w-full`}>
                        <div className="min-w-[20px] flex justify-center">
                          <img src={DashboardIcon} alt="Main Dashboard" className="w-5 h-5" />
                        </div>
                        {isOpen && <span className="whitespace-nowrap">Dashboards</span>}
                      </div>
                      {isOpen && (
                        open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </NavLink>

                    <div className={`transform overflow-hidden transition-all ${!open && 'hidden'}`}>
                      <ul className="space-y-2 mt-2 flex flex-col gap-1.5 bg-black/20 dark:bg-boxdark/30 rounded-md py-2 border-l-2 border-gray-600 dark:border-gray-500 ml-2">
                        {/* Main Dashboard - Moved from standalone to here */}
                        <li>
                          <NavLink
                            to="/dashboard"
                            className={({ isActive }) =>
                              `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm ${(isActive || pathname === '/') ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                            }
                          > 
                            <BarChart3 className="w-6 h-6" />
                            <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Main Dashboard</span>
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/dashboards/survey-dashboard"
                            className={({ isActive }) =>
                              `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                            }
                          >
                            <ClipboardCheck size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                            <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Survey Dashboard</span>
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/dashboards/construction-dashboard"
                            className={({ isActive }) =>
                              `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                            }
                          >
                            <HardHat size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                            <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Construction Dashboard</span>
                          </NavLink>
                        </li>
                        
                        <li>
                          <NavLink
                            to="/dashboards/installation-dashboard"
                            className={({ isActive }) =>
                              `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                            }
                          >
                            <Wrench size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                            <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Installation Dashboard</span>
                          </NavLink>
                        </li>
                        <li>
                          <NavLink
                            to="/dashboards/executive-dashboard"
                            className={({ isActive }) =>
                              `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                            }
                          >
                            <TrendingUp size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                            <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Executive Dashboard</span>
                          </NavLink>
                        </li>
                        {/*<li>
                          <NavLink
                            to="/dashboards/daily-progress"
                            className={({ isActive }) =>
                              `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                            }
                          >
                            <Calendar size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                            <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Daily Progress Report</span>
                          </NavLink>
                        </li>*/}
                      </ul>
                    </div>
                  </React.Fragment>
                );
              }}
            </SidebarLinkGroup>
            )}

            {/* Route Planning - Show ONLY for IE user or with original condition (!viewOnly) */}
            {(ieUser || !viewOnly) && (
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
                          <ul className="space-y-1 mt-2 flex flex-col gap-1.5 bg-black/20 dark:bg-boxdark/30 rounded-md py-2 border-l-2 border-gray-600 dark:border-gray-500 ml-2">
                            <li>
                              <NavLink
                                to="/route-planning/route-list"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm 
                                      ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                                }
                              >
                                <ListCollapse size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                                <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Route List</span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink
                                to="/route-planning/builder"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm 
                                      ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                                }
                              >
                                <MapPinHouse size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                                <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Route Builder</span>
                              </NavLink>
                            </li>
                          </ul>
                        </div>

                      </React.Fragment>
                    );
                  }}
            </SidebarLinkGroup>
             )}
             
             {/* Survey - Visible for everyone including IE user */}
             <SideBarItem
              icon={SurveyIcon}
              label="Survey"
              isOpen={isOpen}
              isActive={!!surveyMatch}
              path="/survey"
            />

             {/* Construction - Original condition (!viewOnly) but hide for IE user */}
             {!viewOnly && !ieUser && (
                <SideBarItem
                  icon={ConstructionImg}
                  label="Construction"
                  isOpen={isOpen}
                  isActive={!!constructionMatch}
                  path="/construction"
                />
              )}

              
             {/* Add Installation Menu Item - Hide for IE user */}
             {!viewOnly && !ieUser && (
                <li>
                  <NavLink
                    to="/installation"
                    className={({ isActive }) =>
                      `flex items-center py-2 ${isOpen ? "px-3 gap-4" : "px-2 gap-0"} rounded-lg 
                      transition-colors duration-200 text-bodydark1
                      ${isActive ? "bg-graydark dark:bg-meta-4 !text-white" : "hover:bg-graydark dark:hover:bg-meta-4"}
                      ${!isOpen ? "w-[44px] justify-center" : ""}`
                    }
                  >
                    <div className="min-w-[20px] flex justify-center">
                      <Settings className="w-5 h-5" />
                    </div>
                    {isOpen && <span className="whitespace-nowrap">Equipment Installation</span>}
                  </NavLink>
                </li>
              )}

             {/* Add Blocks Management above GIS Inventory - Hide for IE user */}
              {!viewOnly && !ieUser && (
                <li>
                  <NavLink
                    to="/blocks-management"
                    className={`
                      flex items-center py-2 ${isOpen ? 'px-3 gap-4' : 'px-2 gap-0'} rounded-lg 
                      transition-colors duration-200 text-bodydark1 
                      ${pathname.includes('blocks-management') 
                        ? 'bg-graydark dark:bg-meta-4' 
                        : 'hover:bg-graydark dark:hover:bg-meta-4'}
                      ${!isOpen ? 'w-[44px] justify-center' : ''}
                    `}
                  >
                    <div className="min-w-[20px] flex justify-center">
                      <Grid3X3 className="w-5 h-5" />
                    </div>
                    {isOpen && <span className="whitespace-nowrap">Block Assginment</span>}
                  </NavLink>
                </li>
              )}

              {/* GIS Inventory - Show for InvOnly OR IE user */}
              {(InvOnly || ieUser) && (
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
                    <img src={Smart_Inv} className="w-5 flex-shrink-0" alt="GIS Inventory" />
                    {isOpen && <span className="whitespace-nowrap">GIS Inventory</span>}
                  </NavLink>
                </li>
              )}
              
              {/* Machine Management - Hide for IE user */}
              {!viewOnly && !ieUser && (
                <>
              
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
                            {isOpen && <span className="whitespace-nowrap">Machines</span>}
                          </div>

                          {isOpen && (
                            open
                              ? <ChevronUp className="w-4 h-4 text-gray-500" />
                              : <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </NavLink>


                        <div className={`transform overflow-hidden transition-all ${!open && 'hidden'}`}>
                          <ul className="space-y-1 mt-2 flex flex-col gap-1.5 bg-black/20 dark:bg-boxdark/30 rounded-md py-2 border-l-2 border-gray-600 dark:border-gray-500 ml-2">
                            <li>
                              <NavLink
                                to="/machine-management/machines"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm 
                                      ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                                }
                              >
                                <Cog size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                                <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Machines</span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink
                                to="/machine-management/machine-tracking"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm 
                                      ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                                }
                              >
                                <LocateFixed size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                                <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Machine Tracking</span>
                              </NavLink>
                            </li>
                          </ul>
                        </div>

                      </>
                    );
                  }}
                </SidebarLinkGroup>

           
                {/* <SideBarItem icon={KML} label="Filter GP Points" isOpen={isOpen} isActive={pathname.includes('gp-points-filter')} path='/gp-points-filter' /> */}
                {/* Master Data - Hide for IE user */}
                {!ieUser && (
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
                            {isOpen && <span className='whitespace-nowrap'>Master Data</span>}
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
                          <ul className="space-y-1 mt-2 flex flex-col gap-1.5 bg-black/20 dark:bg-boxdark/30 rounded-md py-2 border-l-2 border-gray-600 dark:border-gray-500 ml-2">
                            <li>
                              <NavLink
                                to="/managementlist/companies"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm 
                                      ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                                }
                              >
                                <Building size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                                <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Companies</span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink
                                to="/managementlist/users"
                                className={({ isActive }) =>
                                  `group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm 
                                      ${isActive ? '!text-white bg-graydark/50' : 'hover:bg-graydark/30'}`
                                }
                              >
                                <User2Icon size={16} className="min-w-[16px] flex-shrink-0 opacity-80" />
                                <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Users</span>
                              </NavLink>
                            </li>
                            <li>
                              <NavLink to="/managementlist/gplist"
                               className={({isActive})=>`group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 font-medium text-bodydark2 duration-300 ease-in-out hover:text-white whitespace-nowrap text-sm
                                          ${isActive ? `!text-white bg-graydark/50`: 'hover:bg-graydark/30'}`}>
                                <Globe2Icon size={16} className='min-w-[16px] flex-shrink-0 opacity-80'/>   
                                <span className={`${isOpen ? 'block' : 'hidden'} truncate`}>Gp List</span>
                              </NavLink>
                            </li>
                          </ul>
                        </div>

                      </React.Fragment>
                    );
                  }}
                </SidebarLinkGroup>
                )}
              </>
            )}
            {!viewOnly && (
              <>
                {/* <SideBarItem icon={User} label="KML File Upload" isOpen={isOpen} isActive={pathname.includes('kmlfileupload')} path='/kmlfileupload' /> */}

              </>
            )}
          </ul>
        </div>

        {/* Profile Section and Dark Mode Toggler at Bottom - Fixed */}
        <div className="px-2 pb-4 mt-auto flex-shrink-0">
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

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar {
          /* Firefox */
          scrollbar-width: thin;
          scrollbar-color: rgba(75, 85, 99, 0.8) transparent;
        }
        
        /* Webkit browsers (Chrome, Safari, Edge) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.6);
          border-radius: 3px;
          transition: all 0.2s ease;
          border: none;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.8);
        }
        
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
        
        /* Dark mode adjustments */
        .dark .custom-scrollbar {
          scrollbar-color: rgba(55, 65, 81, 0.8) transparent;
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(55, 65, 81, 0.6);
        }
        
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(55, 65, 81, 0.8);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;