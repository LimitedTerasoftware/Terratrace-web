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
      <NavLink
        to={path}
        className={`
          flex items-center py-2 px-3 rounded-lg transition-colors duration-200
         text-bodydark1 
          ${isActive 
            ? 'bg-graydark dark:bg-meta-4' 
            : 'hover:bg-graydark dark:hover:bg-meta-4'
          }
        `}
      >
        <div className="min-w-[24px] flex justify-center">
        <img src={icon} alt={label} className="w-5 h-5 object-contain" />

        </div>
        <span className={`ml-3 ${isOpen ? 'block' : 'hidden'}`}>{label}</span>
      </NavLink>
    </li>
  );
};