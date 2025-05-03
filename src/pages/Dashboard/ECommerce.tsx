import React, {useState, useEffect} from 'react';
import MapOne from '../../components/Maps/MapOne';
import StatBox from '../../components/StatBox';
import UserStatBox from '../../components/UserStatBox';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from 'react-router-dom';
import moment from "moment";


const tabs = [
  { label: "All Data", value: "" },
  { label: "Today", value: moment().format("YYYY-MM-DD") },
  { label: "Yesterday", value: moment().subtract(1, "days").format("YYYY-MM-DD") },
  { label: "Last 7 Days", value: "last_7_days" },
  { label: "Last 30 Days", value: "last_30_days" }
];


const ECommerce: React.FC = () => {
  const BASEURL = import.meta.env.VITE_API_BASE;
  const navigate = useNavigate();
  const [loading,setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState(""); // Default: Today
  const [selectedState, setSelectedState] = useState(""); // Default: All States
  const [states, setStates] = useState<{ state_id: number; state_name: string }[]>([]);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [stats, setStats] = useState({
    allUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    allGPS: 0,
    pendingGPS:0,
    acceptedGPS:0,
    rejectedGPS:0,
    allBSNL: 0,
    pendingBSNL:0,
    acceptedBSNL:0,
    rejectedBSNL:0,
    allAerial: 0,
    pendingAerial:0,
    acceptedAerial:0,
    rejectedAerial:0,
    allUnderGround: 0,
    pendingUnderGround:0,
    acceptedUnderGround:0,
    rejectedUnderGround:0,
    allHOTO: 0,
    pendingHOTO:0,
    acceptedHOTO:0,
    rejectedHOTO:0,
  });

  const handleBsnlNavigate = () => {
    navigate('/survey?tab=bsnl'); // Navigate to the BSNL Survey page
  };

  const handleGpNavigate = () => {
    navigate('/survey?tab=gp'); // Navigate to the BSNL Survey page
  };

  const handleAerialNavigate = () => {
    navigate('/survey?tab=aerial'); // Navigate to the BSNL Survey page
  };

  const handleUGNavigate = () => {
    navigate('/survey?tab=ground'); // Navigate to the BSNL Survey page
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        let url = `${BASEURL}/dashboard?state_id=${selectedState}`;
        if (selectedTab) {
          url += `&date=${selectedTab}`;
        }

        const response = await axios.get(url);


        if (response.data.success) {
          setLoading(false)
          setStats(response.data.data);
        }
      } catch (error) {
        setLoading(false)
        console.error('Error fetching stats:', error);
      }
    };

    fetchData();
  }, [selectedTab, selectedState]);

  
useEffect(() => {
  if (selectedTab === 'last_7_days') {
    setFromDate(moment().subtract(7, 'days').format("YYYY-MM-DD"));
    setToDate(moment().format("YYYY-MM-DD"));
  } else if (selectedTab === 'last_30_days') {
    setFromDate(moment().subtract(30, 'days').format("YYYY-MM-DD"));
    setToDate(moment().format("YYYY-MM-DD"));
  } else {
   
    setFromDate(selectedTab);
    setToDate(selectedTab);
  }
}, [selectedTab]);

  const chartData = [
    { name: "GPS", Pending: stats.pendingGPS, Accepted: stats.acceptedGPS, Rejected: stats.rejectedGPS },
    { name: "BLOCK", Pending: stats.pendingBSNL, Accepted: stats.acceptedBSNL, Rejected: stats.rejectedBSNL },
    { name: "Aerial", Pending: stats.pendingAerial, Accepted: stats.acceptedAerial, Rejected: stats.rejectedAerial },
    { name: "UnderGround", Pending: stats.pendingUnderGround, Accepted: stats.acceptedUnderGround, Rejected: stats.rejectedUnderGround },
  ];


  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await axios.get(`${BASEURL}/states`);
        if (response.data.success) {
          setStates(response.data.data); // Store state list
        }
      } catch (error) {
        console.error("Error fetching states:", error);
      }
    };

    fetchStates();
  }, []);

  const handleBsnlRedirect = (status?: number) => {
    if (status === undefined) {
      navigate(`/survey?tab=bsnl`,{
        state:{
         state: selectedState,
         formdate:fromDate,
         todate:toDate
        }
      });
    } else {
      // navigate(`/survey?tab=bsnl&status=${status}`);
      navigate(`/survey?tab=bsnl&status=${status}`, {
        state:{
          state: selectedState,
          formdate:fromDate,
          todate:toDate
         }
      });
      
    }
  };

  const handleGPRedirect = (status?: number) => {
   
    if (status === undefined) {
      navigate(`/survey?tab=gp`, {
        state:{
          state: selectedState,
          formdate:fromDate,
          todate:toDate
         }
      });
    } else {
      navigate(`/survey?tab=gp&status=${status}`, {
        state:{
          state: selectedState,
          formdate:fromDate,
          todate:toDate
         }
      });
    }
    
  };

  const handleHOTORedirect = (status?: number) => {
    if (status === undefined) {
      navigate(`/survey?tab=hoto`, {
        state:{
          state: selectedState,
          formdate:fromDate,
          todate:toDate
         }
      });
    } else {
      navigate(`/survey?tab=hoto&status=${status}`, {
        state:{
          state: selectedState,
          formdate:fromDate,
          todate:toDate
         }
      });
    }
  };

  const handleAerialRedirect = (status?: number) => {
    if (status === undefined) {
      navigate(`/survey?tab=aerial`, {
        state:{
          state: selectedState,
          formdate:fromDate,
          todate:toDate
         }
      });
    } else {
      navigate(`/survey?tab=aerial&status=${status}`, {
        state:{
          state: selectedState,
          formdate:fromDate,
          todate:toDate
         }
      });
    }
  };

  const handleGroundRedirect = (status?: number) => {
    if (status === undefined) {
      navigate(`/survey?tab=ground`, {
        state:{
          state: selectedState,
          formdate:fromDate,
          todate:toDate
         }
      });
    } else {
      navigate(`/survey?tab=ground&status=${status}`, {
        state:{
          state: selectedState,
          formdate:fromDate,
          todate:toDate
         }
      });
    }
  };
  return (
    <>
      {/* Header Section */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 shadow-md rounded-lg gap-4">
      <h2 className="text-xl font-semibold text-gray-700">Dashboard</h2>

        {/* Filters: Tabs & Dropdown */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-2 sm:gap-4">
        {/* Time Filter Tabs */}
        <div className="flex overflow-x-auto whitespace-nowrap bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
        {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setSelectedTab(tab.value)}
              className={`px-4 py-2 text-sm rounded-lg ${
                selectedTab === tab.value
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
          </div>

          {/* State Dropdown */}
          <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          className="border px-3 py-2 rounded-lg bg-white text-gray-700 w-full lg:w-[200px] "
         
        >
          <option value="">All States</option>
          {states.map((state) => (
            <option key={state.state_id} value={state.state_id}>
              {state.state_name}
            </option>
          ))}
        </select>

          {/* From Date */}
          <input
            type="date"
            value={fromDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFromDate(e.target.value)}
            className="border px-3 py-2 rounded-lg bg-white text-gray-700 w-full sm:w-auto"
           
          />

          {/* To Date */}
          <input
            type="date"
            value={toDate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setToDate(e.target.value)}
            className="border px-3 py-2 rounded-lg bg-white text-gray-700 w-full sm:w-auto"
            
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mt-6 mb-6">
       <StatBox 
        title="Block Survey" 
        rejected={stats.rejectedBSNL} 
        pending={stats.pendingBSNL} 
        total={stats.allBSNL} 
        completed={stats.acceptedBSNL} 
        onApprovedClick={() => handleBsnlRedirect(1)}
        onPendingClick={() => handleBsnlRedirect(0)}
        onRejectedClick={() => handleBsnlRedirect(2)}
        onTotalClick={() => handleBsnlRedirect(undefined)}
      />

       <StatBox 
        title="GP Survey" 
        rejected={stats.rejectedGPS} 
        pending={stats.pendingGPS} 
        total={stats.allGPS} 
        completed={stats.acceptedGPS} 
        onApprovedClick={() => handleGPRedirect(1)}
        onPendingClick={() => handleGPRedirect(0)}
        onRejectedClick={() => handleGPRedirect(2)}
        onTotalClick={() => handleGPRedirect(undefined)}
      />

      <StatBox 
        title="Aerial Survey" 
        rejected={stats.rejectedAerial} 
        pending={stats.pendingAerial} 
        total={stats.allAerial} 
        completed={stats.acceptedAerial}
        onApprovedClick={() => handleAerialRedirect(1)}
        onPendingClick={() => handleAerialRedirect(0)}
        onRejectedClick={() => handleAerialRedirect(2)}
        onTotalClick={() => handleAerialRedirect(undefined)} 
      />
        
       <StatBox 
          title="UG Survey" 
          rejected={stats.rejectedUnderGround} 
          pending={stats.pendingUnderGround} 
          total={stats.allUnderGround} 
          completed={stats.acceptedUnderGround}
          onApprovedClick={() => handleGroundRedirect(1)}
          onPendingClick={() => handleGroundRedirect(0)}
          onRejectedClick={() => handleGroundRedirect(2)}
          onTotalClick={() => handleGroundRedirect(undefined)}
        />
      </div>

      {/* <StatBox 
        title="HOTO Survey" 
        rejected={stats.rejectedHOTO} 
        pending={stats.pendingHOTO} 
        total={stats.allHOTO} 
        completed={stats.acceptedHOTO} 
        onApprovedClick={() => handleHOTORedirect(1)}
        onPendingClick={() => handleHOTORedirect(0)}
        onRejectedClick={() => handleHOTORedirect(2)}
        onTotalClick={() => handleHOTORedirect(undefined)}
      /> */}
      
      <div className="flex flex-row gap-6 mt-10 w-full">
        {/* Left - StatBox */}
        <div className="w-1/3">
        <StatBox 
        title="HOTO Survey" 
        rejected={stats.rejectedHOTO} 
        pending={stats.pendingHOTO} 
        total={stats.allHOTO} 
        completed={stats.acceptedHOTO} 
        onApprovedClick={() => handleHOTORedirect(1)}
        onPendingClick={() => handleHOTORedirect(0)}
        onRejectedClick={() => handleHOTORedirect(2)}
        onTotalClick={() => handleHOTORedirect(undefined)}
      />

        {/* <UserStatBox 
            title="Users" 
            active={stats.activeUsers} 
            inactive={stats.inactiveUsers} 
            total={stats.allUsers} 
          /> */}
        </div>

        {/* Right - Table */}
        <div className="w-2/3 overflow-x-auto">
          <table className="min-w-full border bg-white border-gray-300 text-gray-600">
            <thead>
              <tr className="bg-blue-300">
                <th className="border border-gray-300 px-4 py-2 text-left"></th>
                <th className="border border-gray-300 px-4 py-2 text-left">Approved</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Pending</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Rejected</th>
              </tr>
            </thead>
            <tbody>
            <tr className="border border-gray-300 cursor-pointer" onClick={handleGpNavigate}>
                <td className="border border-gray-300 px-4 py-2">Gp Survey</td>
                <td className="border border-gray-300 px-4 py-2">{stats.acceptedGPS} </td>
                <td className="border border-gray-300 px-4 py-2">{stats.pendingGPS}</td>
                <td className="border border-gray-300 px-4 py-2">{stats.rejectedGPS}</td>
              </tr>
              <tr className="border border-gray-300 cursor-pointer" onClick={handleBsnlNavigate}>
                <td className="border border-gray-300 px-4 py-2">Block Survey</td>
                <td className="border border-gray-300 px-4 py-2">{stats.acceptedBSNL}</td>
                <td className="border border-gray-300 px-4 py-2">{stats.pendingBSNL}</td>
                <td className="border border-gray-300 px-4 py-2">{stats.rejectedBSNL}</td>
              </tr>
              <tr className="border border-gray-300 cursor-pointer" onClick={handleAerialNavigate}>
                <td className="border border-gray-300 px-4 py-2">Aerial Survey</td>
                <td className="border border-gray-300 px-4 py-2">{stats.acceptedAerial}</td>
                <td className="border border-gray-300 px-4 py-2">{stats.pendingAerial}</td>
                <td className="border border-gray-300 px-4 py-2">{stats.rejectedAerial}</td>
              </tr>
              <tr className="border border-gray-300 cursor-pointer" onClick={handleUGNavigate}>
                <td className="border border-gray-300 px-4 py-2">UG Survey</td>
                <td className="border border-gray-300 px-4 py-2">{stats.acceptedUnderGround}</td>
                <td className="border border-gray-300 px-4 py-2">{stats.pendingUnderGround}</td>
                <td className="border border-gray-300 px-4 py-2">{stats.rejectedUnderGround}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
  
      {/* Chart Section (Left) */}
      <div className="col-span-12 md:col-span-6 xl:col-span-7 rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-blue-700 text-center mb-4">Survey Progress</h2>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Pending" stroke="#fbbf24" strokeWidth={2} />
            <Line type="monotone" dataKey="Accepted" stroke="#10b981" strokeWidth={2} />
            <Line type="monotone" dataKey="Rejected" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Map Section (Right) */}
      <div className="col-span-12 md:col-span-6 xl:col-span-5">
        <MapOne />
      </div>

    </div>

    </>
  );
};

export default ECommerce;
