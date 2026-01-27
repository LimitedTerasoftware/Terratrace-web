import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BsnlTables from "../../pages/BsnlTables";
import GpTables from "../../pages/GpTables";
import AerailTables from "../../pages/UiElements/AerailTables";
import UndergroundTables from "../../pages/UiElements/UndergroundTables";
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import HotoTables from "../../pages/HotoTables";
import { Header } from "../Breadcrumbs/Header";
import { isIEUser } from '../../utils/accessControl';
import Joints from "../Joints/joints";

// Define tab types
type TabType = "bsnl" | "gp" | "aerial" | "ground" | "hoto" | "joints";

// Placeholder Components...
const BsnlSurvey: React.FC = () => <div className="py-2"><BsnlTables /></div>;
const GpSurvey: React.FC = () => <div className="py-2"><GpTables /></div>;
const AerialSurvey: React.FC = () => <div className="py-2"><AerailTables /></div>;
const GroundSurvey: React.FC = () => <div className="py-2"><UndergroundTables /></div>;
const HotoSurvey: React.FC = () => <div className="py-2"><HotoTables /></div>;
const JointsTab:React.FC = () =><div className="py-2"><Joints/></div>

// Tab Data
const tabs: { id: TabType; label: string }[] = [
  { id: "bsnl", label: "Block Survey" },
  { id: "gp", label: "GP Survey" },
  { id: "aerial", label: "Aerial Survey" },
  { id: "ground", label: "Ground Survey" },
  { id: "hoto", label: "Hoto Survey" },
  { id: "joints",label:"Joints"}
];

const SurveyTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Filter tabs based on user access
  const availableTabs = tabs.filter(tab => {
    // Hide HOTO Survey for IE users
    if (tab.id === "hoto" && isIEUser()) {
      return false;
    }
    return true;
  });

  // Get tab from URL or fallback to first available tab
  const getTabFromURL = (): TabType => {
    const params = new URLSearchParams(location.search);
    const urlTab = params.get("tab") as TabType;
    
    // Check if URL tab is available for this user
    const isTabAvailable = availableTabs.some(tab => tab.id === urlTab);
    return isTabAvailable ? urlTab : (availableTabs[0]?.id as TabType) || "bsnl";
  };

  const [activeTab, setActiveTab] = useState<TabType>(getTabFromURL);

  // Update active tab when URL changes
  useEffect(() => {
    setActiveTab(getTabFromURL());
  }, [location.search]);

  // Handle tab change and update URL
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    navigate(`?tab=${tabId}`, { replace: true }); // Update URL without adding to history
  };

  // Function to render content dynamically
  const renderTabContent = (): JSX.Element => {
    switch (activeTab) {
      case "bsnl":
        return <BsnlSurvey />;
      case "gp":
        return <GpSurvey />;
      case "aerial":
        return <AerialSurvey />;
      case "ground":
        return <GroundSurvey />;
      case "hoto":
        return <HotoSurvey />;
      case "joints":
        return <JointsTab/>;
      default:
        return <BsnlSurvey />;
    }
  };

  return (
    <div className="w-full">
      {/* <Breadcrumb pageName="Survey Forms" /> */}
      <Header activeTab={activeTab} BackBut={false}/>

      {/* Tabs Header */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4 mt-4">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? "border-b-4 border-blue-500 text-blue-600"
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-2">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default SurveyTabs;