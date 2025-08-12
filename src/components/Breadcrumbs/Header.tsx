import { Satellite, Map, Camera, Truck, ClipboardList } from "lucide-react"; 
import { Link } from "react-router-dom";

type TabType = "bsnl" | "gp" | "aerial" | "ground" | "hoto";

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
export  function Header({ activeTab }: { activeTab: TabType }) {
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
         <nav>
            <ol className="flex items-center gap-2">
                <li>
                <Link className="font-medium" to="/">
                    Dashboard /
                </Link>
                </li>
                <li className="font-medium text-primary">{title}</li>
            </ol>
              </nav>
      </div>
    </header>
  );
}


