import { Satellite, Map, Camera, Truck, ClipboardList, Building2, ArrowLeft, Edit3 } from "lucide-react"; 
import { Link } from "react-router-dom";

type TabType = "bsnl" | "gp" | "aerial" | "ground" | "hoto" | "bsnlaview" | "bsnledit";

const tabHeaderData: Record<
  string,
  { icon: React.ElementType; title: string; subtitle: string; bgColor: string }
> = {
  bsnl: {
    icon: Satellite,
    title: "Block Survey Tracker",
    subtitle: "Monitoring block survey progress in real time",
    bgColor: "bg-blue-600"
  },
  bsnlaview:{
    icon: Building2,
    title: "BSNL Exchange Details",
    subtitle: "Comprehensive infrastructure information",
    bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600" 
  },
  bsnledit: {
    icon: Edit3,
    title: "Edit BSNL Exchange",
    subtitle: "Update and manage BSNL exchange details",
    bgColor: "bg-gradient-to-br from-yellow-500 to-orange-500"
  },
 gp: {
    icon: Map,
    title: "GP Survey Tracker",
    subtitle: "Monitoring gram panchayat survey progress",
    bgColor: "bg-green-600"
  },
  aerial: {
    icon: Camera,
    title: "Aerial Survey Tracker",
    subtitle: "Drone-based aerial survey monitoring",
    bgColor: "bg-purple-600"
  },
  ground: {
    icon: Truck,
    title: "Ground Survey Tracker",
    subtitle: "On-site ground survey tracking",
    bgColor: "bg-orange-600"
  },
  hoto: {
    icon: ClipboardList,
    title: "Hoto Survey Tracker",
    subtitle: "Handover-Takeover survey details",
    bgColor: "bg-red-600"
  }
};
export  function Header({ activeTab ,BackBut}: { activeTab: TabType ,BackBut:boolean}) {
  const { icon: Icon, title, subtitle, bgColor } = tabHeaderData[activeTab] || tabHeaderData.bsnl;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
          {/* <div className="hidden md:flex space-x-6">
             <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-500">Total Surveys</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-500">Total Accepted</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">0</div>
                <div className="text-sm text-gray-500">Total Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-sm text-gray-500">Total Rejected</div>
              </div>
            </div> */}
            {BackBut ?  
            <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700  transition-colors duration-200 group"
                  onClick={() => window.history.back()}
                >
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors duration-200">
                    <ArrowLeft className="h-4 w-4" />
                  </div>
                  <span className="font-medium">Back to List</span>
                </button>
              </div> :
            <nav>
            <ol className="flex items-center gap-2">
                <li>
                <Link className="font-medium" to="/dashboard">
                    Dashboard /
                </Link>
                </li>
                <li className="font-medium text-primary">{title}</li>
            </ol>
          </nav>}
        
         
      </div>
    </header>
  );
}


