import React, { useState } from 'react'
import GPInstallationReport from './GPInstallationReport';
import BlockInstallationReport from './BlockInstallationReport';

interface MainInstallationReportProps {
  Data: {
    selectedState: string | null;
    selectedDistrict: string | null;
    selectedBlock: string | null;
    fromdate: string;
    todate: string;
    globalsearch: string;
    excel: boolean;
    filtersReady: boolean;
  };
  Onexcel: () => void;
  activeTab: 'GP_INSTALLATION' | 'BLOCK_INSTALLATION';
  onTabChange: (tab: 'GP_INSTALLATION' | 'BLOCK_INSTALLATION') => void;
}

const MainInstallationReport: React.FC<MainInstallationReportProps> = ({ 
  Data, 
  Onexcel, 
  activeTab, 
  onTabChange 
}) => {
  return (
    <div className="min-h-screen">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center px-6">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg outline-none ${
                activeTab === 'GP_INSTALLATION'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => onTabChange('GP_INSTALLATION')}
            >
              GP Installation
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg outline-none ${
                activeTab === 'BLOCK_INSTALLATION'
                  ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                  : 'hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
              onClick={() => onTabChange('BLOCK_INSTALLATION')}
            >
              Block Installation
            </button>
          </li>
        </ul>
      </div>

      {/* Tab Content */}
      {activeTab === 'GP_INSTALLATION' ? (
        <GPInstallationReport 
          Data={Data}
          Onexcel={Onexcel}
        />
      ) : (
        <BlockInstallationReport 
          Data={Data}
          Onexcel={Onexcel}
        />
      )}
    </div>
  );
};

export default MainInstallationReport;