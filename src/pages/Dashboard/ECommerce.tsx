import React, { useState, useEffect } from 'react';
import MapOne from '../../components/Maps/MapOne';
import StatBox from '../../components/StatBox';
import UserStatBox from '../../components/UserStatBox';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useNavigate } from 'react-router-dom';
import moment from "moment";
import Card from '../UiElements/Card';
import SurveyProgressChart from './SurveyProgressChart'
import UsersDonutChart from './UsersDonutChart';


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
  const [timeFrame, setTimeFrame] = useState<'1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL'>('3M');
  const [loading, setLoading] = useState(true)
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
    pendingGPS: 0,
    acceptedGPS: 0,
    rejectedGPS: 0,
    allBSNL: 0,
    pendingBSNL: 0,
    acceptedBSNL: 0,
    rejectedBSNL: 0,
    allAerial: 0,
    pendingAerial: 0,
    acceptedAerial: 0,
    rejectedAerial: 0,
    allUnderGround: 0,
    pendingUnderGround: 0,
    acceptedUnderGround: 0,
    rejectedUnderGround: 0,
    allHOTO: 0,
    pendingHOTO: 0,
    acceptedHOTO: 0,
    rejectedHOTO: 0,
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

  const handleHotoNavigate = () => {
    navigate('/survey?tab=hoto'); // Navigate to the BSNL Survey page
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
      navigate(`/survey?tab=bsnl`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
        }
      });
    } else {
      // navigate(`/survey?tab=bsnl&status=${status}`);
      navigate(`/survey?tab=bsnl&status=${status}`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
        }
      });

    }
  };

  const handleGPRedirect = (status?: number) => {

    if (status === undefined) {
      navigate(`/survey?tab=gp`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
        }
      });
    } else {
      navigate(`/survey?tab=gp&status=${status}`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
        }
      });
    }

  };

  const handleHOTORedirect = (status?: number) => {
    if (status === undefined) {
      navigate(`/survey?tab=hoto`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
        }
      });
    } else {
      navigate(`/survey?tab=hoto&status=${status}`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
        }
      });
    }
  };

  const handleAerialRedirect = (status?: number) => {
    if (status === undefined) {
      navigate(`/survey?tab=aerial`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
        }
      });
    } else {
      navigate(`/survey?tab=aerial&status=${status}`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
        }
      });
    }
  };

  const handleGroundRedirect = (status?: number) => {
    if (status === undefined) {
      navigate(`/survey?tab=ground`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
        }
      });
    } else {
      navigate(`/survey?tab=ground&status=${status}`, {
        state: {
          state: selectedState,
          formdate: fromDate,
          todate: toDate
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

      <div className="flex flex-col md:flex-row justify-between items-center  p-4 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-900 tracking-tight mb-4 md:mb-0 transition-colors duration-300">
          Dashboard</h1>

        {/* Filters: Tabs & Dropdown */}
        <div className="flex flex-col sm:flex-row w-full sm:w-auto items-center gap-2 sm:gap-4">
          {/* Time Filter Tabs */}
          {/* <div className="flex overflow-x-auto whitespace-nowrap bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setSelectedTab(tab.value)}
                className={`px-4 py-2 text-sm rounded-lg ${selectedTab === tab.value
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-700"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div> */}
          <select
            value={selectedTab}
            onChange={(e) => setSelectedTab(e.target.value)}
            className="border px-3 py-2 rounded-lg bg-white text-gray-700 w-full lg:w-[200px] "

          >
            {tabs.map((tab) => (
              <option key={tab.label} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>

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
      {/* ----------------------------------- Survey Progress Chart ------------------------------------------*/}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-lg font-medium text-gray-800">Survey Progress</h2>
              <p className="text-sm text-gray-500">Under Ground</p>
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
              <div className="relative w-full sm:w-auto">
                <select
                  className="appearance-none bg-white border border-gray-200 rounded-md px-3 py-1.5 pr-8 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>Accepted</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  className="appearance-none bg-white border border-gray-200 rounded-md px-3 py-1.5 pr-8 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option>GPS</option>
                  <option>BLOCK</option>
                  <option>Aerial</option>
                  <option>UnderGround</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
          <div className="h-64 md:h-72">
            <SurveyProgressChart data={chartData} timeFrame={timeFrame} />
          </div>

          <div className="flex justify-between mt-4 border-t pt-3">
            {(['1W', '1M', '3M', '6M', '1Y', '5Y', 'ALL'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFrame(period)}
                className={`text-xs font-medium px-3 py-1 rounded-full transition ${timeFrame === period
                  ? 'bg-gray-100 text-indigo-600'
                  : 'hover:bg-gray-100'
                  }`}
              >
                {period}
              </button>
            ))}
          </div>

        </Card>
        <Card>
          <div className="mb-2">
            <h2 className="text-lg font-medium text-gray-800">Users</h2>
          </div>

          <div className="h-64 flex items-center justify-center">
            <UsersDonutChart UserData={stats} />
          </div>
        </Card>

      </div>
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        
        {/* Left Side: Table */}
        <div className="col-span-12 md:col-span-6 xl:col-span-6">
          <div className="bg-white shadow rounded-lg h-full flex flex-col overflow-x-auto">
            <table className="min-w-full border border-gray-300 text-gray-600 flex-grow">
              <thead>
                <tr className="bg-violet-100 text-gray-900">
                  <th className="border border-gray-300 px-4 py-2 text-left">Survey</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Approved</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Pending</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Rejected</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr>
                  <td 
                    className="border border-gray-300 px-4 py-2 text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleGPRedirect(undefined)}
                  >
                    Gp Survey
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-green-100 text-green-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGPRedirect(1);
                    }}
                  >
                    {stats.acceptedGPS}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-yellow-100 text-yellow-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGPRedirect(0);
                    }}
                  >
                    {stats.pendingGPS}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-red-100 text-red-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGPRedirect(2);
                    }}
                  >
                    {stats.rejectedGPS}
                  </td>
                </tr>
                
                <tr>
                  <td 
                    className="border border-gray-300 px-4 py-2 text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleBsnlRedirect(undefined)}
                  >
                    Block Survey
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-green-100 text-green-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBsnlRedirect(1);
                    }}
                  >
                    {stats.acceptedBSNL}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-yellow-100 text-yellow-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBsnlRedirect(0);
                    }}
                  >
                    {stats.pendingBSNL}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-red-100 text-red-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBsnlRedirect(2);
                    }}
                  >
                    {stats.rejectedBSNL}
                  </td>
                </tr>
                
                <tr>
                  <td 
                    className="border border-gray-300 px-4 py-2 text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleAerialRedirect(undefined)}
                  >
                    Aerial Survey
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-green-100 text-green-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAerialRedirect(1);
                    }}
                  >
                    {stats.acceptedAerial}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-yellow-100 text-yellow-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAerialRedirect(0);
                    }}
                  >
                    {stats.pendingAerial}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-red-100 text-red-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAerialRedirect(2);
                    }}
                  >
                    {stats.rejectedAerial}
                  </td>
                </tr>
                
                <tr>
                  <td 
                    className="border border-gray-300 px-4 py-2 text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleGroundRedirect(undefined)}
                  >
                    UG Survey
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-green-100 text-green-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroundRedirect(1);
                    }}
                  >
                    {stats.acceptedUnderGround}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-yellow-100 text-yellow-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroundRedirect(0);
                    }}
                  >
                    {stats.pendingUnderGround}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-red-100 text-red-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroundRedirect(2);
                    }}
                  >
                    {stats.rejectedUnderGround}
                  </td>
                </tr>
                
                <tr>
                  <td 
                    className="border border-gray-300 px-4 py-2 text-black cursor-pointer hover:bg-gray-100"
                    onClick={() => handleHOTORedirect(undefined)}
                  >
                    Hoto Survey
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-green-100 text-green-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHOTORedirect(1);
                    }}
                  >
                    {stats.acceptedHOTO}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-yellow-100 text-yellow-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHOTORedirect(0);
                    }}
                  >
                    {stats.pendingHOTO}
                  </td>
                  <td 
                    className="border border-gray-300 px-4 py-2 cursor-pointer hover:bg-red-100 text-red-700 font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHOTORedirect(2);
                    }}
                  >
                    {stats.rejectedHOTO}
                  </td>
                </tr>
              </tbody>

            </table>
          </div>
        </div>

        {/* Right Side: Map */}
        <div className="col-span-12 md:col-span-6 xl:col-span-6 flex flex-col">
          <div className="h-full bg-white shadow rounded-lg overflow-hidden">
            <MapOne />
          </div>
        </div>
      </div>



{/* 
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
      </div> */}

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
{/* 
      <div className="flex flex-row gap-6 mt-10 w-full">
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

          <UserStatBox 
            title="Users" 
            active={stats.activeUsers} 
            inactive={stats.inactiveUsers} 
            total={stats.allUsers} 
          /> 
        </div>

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
      </div> */}
{/* 
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">

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

        <div className="col-span-12 md:col-span-6 xl:col-span-5">
          <MapOne />
        </div>

      </div> */}

    </>
  );
};

export default ECommerce;
