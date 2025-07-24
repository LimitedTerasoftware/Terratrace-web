import React, { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

interface NavLinkProps {
  icon: string;
  label: string;
  isOpen: boolean;
  isActive?: boolean;
  path:string;
}

export const SideBarItem: React.FC<NavLinkProps> = ({ 
  path,
  icon, 
  label, 
  isOpen, 
  isActive = false 
}) => {
  return (
    <li>
    <NavLink to={path} className="group block">
    <div
      className={`
        flex items-center ${isOpen ? 'px-3' : 'px-1'} py-2 rounded-md transition-all duration-200
        text-bodydark1
        ${isActive 
          ? 'bg-graydark dark:bg-meta-4' 
          : 'hover:bg-graydark dark:hover:bg-meta-4'}
        ${!isOpen ? 'w-[40px]' : 'w-full'}
      `}
    >
      <div className="w-[24px] h-[24px] flex justify-center items-center">
        <img src={icon} alt={label} className="w-5 h-5 object-contain" />
      </div>
      <span className={`ml-3 ${isOpen ? 'block' : 'hidden'}`}>{label}</span>
    </div>
    </NavLink>
    </li>
  );
};