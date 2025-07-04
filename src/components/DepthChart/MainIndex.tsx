import React, { useEffect, useState } from 'react'
import Breadcrumb from '../Breadcrumbs/Breadcrumb'
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import IndexChart from '.';
import MachineDataTable from './MachineData';
import LiveTrack from './LiveTrack';
import Report from './Report';


function MainIndex() {
type TabType ="Reports" | "Machine-Data" | "live-track" ;

const tabs: { id: TabType; label: string }[] = [
  { id: "Reports", label: "Reports" },
  { id: "Machine-Data", label: "Machine Data" },
  { id: "live-track", label: "Live Tracking" },
  
];

const [activeTab, setActiveTab] = useState<TabType>();
  const location = useLocation();
  const navigate = useNavigate();

 const getTabFromURL = (): TabType => {
    const params = new URLSearchParams(location.search);
    return (params.get("tab") as TabType) || "Reports";
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
    
      case "Machine-Data":
        return <MachineDataTable />;
         case "live-track":
        return <LiveTrack />;
        case "Reports":
        return <Report />;
      default:
        return  <Report />;
    }
  };

  return (
  <div className="w-full p-4">
      <Breadcrumb pageName="Reports & Tracking" />

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