import React from 'react';
import { BarChart3, Table } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'chart' | 'data';
  onTabChange: (tab: 'chart' | 'data') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 bg-white rounded-t-xl">
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        <button
          onClick={() => onTabChange('chart')}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'chart'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Performance Chart
        </button>
        <button
          onClick={() => onTabChange('data')}
          className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
            activeTab === 'data'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Table className="w-4 h-4" />
          Data Table
        </button>
      </nav>
    </div>
  );
};