import React from 'react';
import { ChevronLeft, ChevronRight, Globe } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, children }) => {
  // Get user email from localStorage
  const getUserEmail = (): string => {
    try {
      const userDataString = localStorage.getItem('userData');
      if (!userDataString) return '';
      
      const userData = JSON.parse(userDataString);
      return userData.email || '';
    } catch (error) {
      console.error('Error getting user email:', error);
      return '';
    }
  };

  // Check if current user is the restricted survey user
  const isRestrictedSurveyUser = (): boolean => {
    const email = getUserEmail();
    return email.toLowerCase() === 'survey.terasoftware.com';
  };

  // Safe toggle handler with error boundary
  const handleToggle = () => {
    try {
      onToggle();
    } catch (error) {
      console.error('Sidebar toggle error:', error);
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleToggle}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative top-0 left-0 h-full bg-white/95 backdrop-blur-sm border-r border-gray-200
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isOpen ? 'w-80' : 'w-0 lg:w-12'}
        overflow-hidden
      `}>
        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className="absolute top-4 -right-3 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:shadow-md transition-shadow z-10"
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isOpen ? (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              {isOpen && (
                <div>
                  <h1 className="font-bold text-gray-900">GIS INVENTORY</h1>
                  <p className="text-xs text-gray-500">Geographic Data Explorer</p>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          {isOpen && (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Pass the restriction check to children via React.cloneElement */}
              {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                  return React.cloneElement(child as React.ReactElement<any>, {
                    hideFileOperations: isRestrictedSurveyUser()
                  });
                }
                return child;
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};