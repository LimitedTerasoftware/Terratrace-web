import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BsnlTables from "../../pages/BsnlTables";
import GpTables from "../../pages/GpTables";
import AerailTables from "../../pages/UiElements/AerailTables";
import UndergroundTables from "../../pages/UiElements/UndergroundTables";
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import HotoTables from "../../pages/HotoTables";
import {Header} from "../Breadcrumbs/Header";
import { Activity as Activity2, MapPin, Clock, TrendingUp } from 'lucide-react';

// Define tab types
type TabType = "bsnl" | "gp" | "aerial" | "ground" | "hoto";

// Placeholder Components...
const BsnlSurvey: React.FC = () => <div className="py-2"><BsnlTables /></div>;
const GpSurvey: React.FC = () => <div className="py-2"><GpTables /></div>;
const AerialSurvey: React.FC = () => <div className="py-2"><AerailTables /></div>;
const GroundSurvey: React.FC = () => <div className="py-2"><UndergroundTables /></div>;
const HotoSurvey: React.FC = () => <div className="py-2"><HotoTables /></div>;

// Tab Data
const tabs: { id: TabType; label: string }[] = [
  { id: "bsnl", label: "Block Survey" },
  { id: "gp", label: "GP Survey" },
  { id: "aerial", label: "Aerial Survey" },
  { id: "ground", label: "Ground Survey" },
  { id: "hoto", label: "Hoto Survey" },
];

const SurveyTabs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get tab from URL or fallback to "bsnl"
  const getTabFromURL = (): TabType => {
    const params = new URLSearchParams(location.search);
    return (params.get("tab") as TabType) || "bsnl";
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
      default:
        return <BsnlSurvey />;
    }
  };

 return (
    <div className="w-full">
      <Breadcrumb pageName="Survey Forms" />
      {/* <Header activeTab={activeTab}/> */}

      {/* Tabs Header */}
       {/* <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-4 mt-4">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
               {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
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
        </div> */}
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
      <div>
         <div className="mt-2">{renderTabContent()}</div>

      </div>
      {/* Content Section */}
      
    </div>
  );
};

export default SurveyTabs;
