import React, { useEffect, useState } from 'react'
import Breadcrumb from '../Breadcrumbs/Breadcrumb'
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import MachineDataTable from './MachineData';
import LiveTrack from './LiveTrack';
import Dashboard from './MachineWorkChart/Dashboard';
import IndexPerformanceChart from './PerformanceChart';

function MainIndex() {
type TabType = "live-track" | "Machine-Data" | "Machine-Work-Chart" | "Performance-Chart";

const tabs: { id: TabType; label: string }[] = [
  { id: "live-track", label: "Live Tracking" },
  { id: "Machine-Data", label: "Machine Data" },
  { id: "Machine-Work-Chart", label: "Machine Work Chart"},
  { id: "Performance-Chart", label: "Performance Chart"},
];

const [activeTab, setActiveTab] = useState<TabType>();
  const location = useLocation();
  const navigate = useNavigate();

 const getTabFromURL = (): TabType => {
    const params = new URLSearchParams(location.search);
    return (params.get("tab") as TabType) || "live-track";
  };

  useEffect(() => {
    setActiveTab(getTabFromURL());
  }, [location.search]);

const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    navigate(`?tab=${tabId}`, { replace: true }); 
  };

   const renderTabContent = (): JSX.Element => {
    switch (activeTab) {
      case "live-track":
        return <LiveTrack/>;
      case "Machine-Data":
        return <MachineDataTable />;
      case "Machine-Work-Chart":
        return <Dashboard MachineId={'1'} View={true}/>;
      case "Performance-Chart":
        return <IndexPerformanceChart/>
      default:
        return <LiveTrack/>;
    }
  };

  return (
  <div className="w-full p-4">
      <Breadcrumb pageName="Machine Tracking" />
      {/* Tabs Header */}
      <div className="flex border-b border-gray-300">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2 text-lg font-semibold transition-all ${
              activeTab === tab.id
                ? "border-b-4 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Content Section */}
      <div className="mt-4">{renderTabContent()}</div>
    </div>  
    )
}

export default MainIndex