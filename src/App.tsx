import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import Loader from './common/Loader';
import PageTitle from './components/PageTitle';
import SignIn from './pages/Authentication/SignIn';
import SignUp from './pages/Authentication/SignUp';
import Calendar from './pages/Calendar';
import Chart from './pages/Chart';
import ECommerce from './pages/Dashboard/ECommerce';
import FormElements from './pages/Form/FormElements';
import FormLayout from './pages/Form/FormLayout';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Tables from './pages/Tables';
import Alerts from './pages/UiElements/Alerts';
import Buttons from './pages/UiElements/Buttons';
import DefaultLayout from './layout/DefaultLayout';
import GpTables from './pages/GpTables';
import BsnlTables from './pages/BsnlTables';
import BsnlExchangeDetailView from './components/Tables/BsnlExchangeDetailView';
import GpDetailView from './components/Tables/GpDetailView';
import AerialDetailView from './components/Tables/AerialDetailView';
import States from './components/Tables/States';
//import Districts from './components/Tables/Districts';
//import Blocks from './components/Tables/Blocks';
import Gpslist from './components/Tables/Gpslist';
import Users from './components/Tables/Users';
import AerailTables from './pages/UiElements/AerailTables';
import SurveyTabs from './components/Tables/SurveyTabs';
import BsnlEdit from './components/Tables/BsnlEdit';
import GpEdit from './components/Tables/GpEdit';
import AerialEdit from './components/Tables/AerialEdit';
import GroundDetailView from './components/Tables/GroundDetailView';
import CompaniesTable from './components/Tables/CompaniesTable';
import HotoDetailView from './components/Tables/HotoDetailView';
import HotoEdit from './components/Tables/HotoEdit';
import FileUpload from "./components/Uploads/KmlManager";
import KMLUpload from './components/KMLUpload/index';
import KmlTable from "./components/Uploads/DataTable";
import RoutePlanning from './components/RoutePlanning/index';

// Added new imports for Route Planning dropdown menu components
import RouteList from './components/RoutePlanning/RouteList';
import RouteReports from './components/RoutePlanning/Reports';
import RouteGPList from './components/RoutePlanning/RouteGPList';
import Login from './pages/Authentication/Login';
import Signup from './pages/Authentication/SignUPNew';
import SmartInventory from './components/SmartInventory/index';
import IndexChart from './components/DepthChart/index';
import MachineDataTable from './components/DepthChart/MachineData';
import MachineManagement from './components/MachineManagement/index';
import MainIndex from './components/DepthChart/MainIndex';
import LiveTrack from './components/DepthChart/LiveTrack';
import Eventreport from './components/DepthChart/UGConstView';
import Report from './components/DepthChart/UGConst';
import Construction from './components/DepthChart/Construction';
//import AuditLogs from './components/AuditLogs';

function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const isAuthRoute = pathname === '/auth/signin' || pathname === '/auth/signup';

  return loading ? (
    <Loader />
  ) : (
    <>
      {isAuthRoute ? (
        <Routes>
          <Route
            path="/auth/signin"
            element={
              <>
                <PageTitle title="Signin | Tricad" />
                {/* <SignIn /> */}
                <Login/>
              </>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <>
                <PageTitle title="Signup | Tricad" />
                {/* <SignUp /> */}
                <Signup/>
              </>
            }
          />
        </Routes>
      ) : (
          <Routes>
            <Route
              index
              element={
                <>
                  <PageTitle title="Tricad Sign In" />
                  {/* <SignIn /> */}
                  <Login/>
                </>
              }
            />
            <Route
              path="/calendar"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Tricad" />
                  <Calendar />
                  </DefaultLayout>
                </>
              }
            />
             <Route
              path="/dashboard"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Tricad Dashboard" />
                  <ECommerce />
                  </DefaultLayout>
                </>
              }
            />
            <Route
              path="/profile"
              element={
                <>
                  <DefaultLayout>
                  <PageTitle title="Profile" />
                  <Profile />
                  </DefaultLayout>
                </>
              }
            />
            <Route
              path="/forms/form-elements"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Form Elements" />
                  <FormElements />
                  </DefaultLayout>
                </>
              }
            />
            <Route
              path="/forms/form-layout"
              element={
                <>
                  <DefaultLayout>
                  <PageTitle title="Form Layout" />
                  <FormLayout />
                  </DefaultLayout>
                </>
              }
            />
            <Route
              path="/tables"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Tables" />
                  <Tables />
                  </DefaultLayout>
                </>
              }
            />

           <Route
              path="/survey"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Survey" />
                  <SurveyTabs />
                  </DefaultLayout>
                </>
              }
            />

            <Route
              path="/survey/gplist"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Gp Survey List" />
                  <GpTables />
                  </DefaultLayout>
                </>
              }
            />

        <Route 
           path="/survey/gp-detail-view/:id" 
           element={
            <>
               <DefaultLayout>
              <PageTitle title="Gp Detail View" />
              <GpDetailView />
              </DefaultLayout>
            </>
           } 
           />

            <Route
              path="/survey/bsnllist"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Block Survey List" />
                  <BsnlTables />
                  </DefaultLayout>
                </>
              }
            />

           <Route
              path="/survey/aeriallist"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Aerial Survey List" />
                  <AerailTables />
                  </DefaultLayout>
                </>
              }
            />

          <Route 
           path="/survey/aerial-detail-view/:id" 
           element={
            <>
               <DefaultLayout>
              <PageTitle title="Aerial Detail View" />
              <AerialDetailView />
              </DefaultLayout>
            </>
           } 
           />

           <Route 
           path="/survey/underground-detail-view/:id" 
           element={
            <>
               <DefaultLayout>
              <PageTitle title="UnderGround Detail View" />
              <GroundDetailView />
              </DefaultLayout>
            </>
           } 
           />

           <Route 
           path="/survey/bsnl-detail-view/:id" 
           element={
            <>
               <DefaultLayout>
              <PageTitle title="Block Survey Detail View" />
              <BsnlExchangeDetailView />
              </DefaultLayout>
            </>
           } 
           />

          <Route 
           path="/survey/hoto-detail-view/:id" 
           element={
            <>
               <DefaultLayout>
              <PageTitle title="HOTO Survey Detail View" />
              <HotoDetailView />
              </DefaultLayout>
            </>
           } 
           />

            <Route 
              path="/survey/hoto-edit/:id" 
              element={
                <>
                  <DefaultLayout>
                    <PageTitle title="HOTO Edit Form" />
                    <HotoEdit />
                  </DefaultLayout>
                </>
              } 
            />
            {/* Updated Route Planning Route - changed path to be consistent with other route planning paths */}
            <Route
              path="/route-planning/builder"
              element={
                <>
                  <PageTitle title="Route Planning" />
                  <RoutePlanning />
                </>
              }
            />
            
            {/* Route Planning Routes */}
            <Route
              path="/route-planning/route-list"
              element={
                <>
                  <DefaultLayout>
                    <PageTitle title="Route List" />
                    <RouteList />
                  </DefaultLayout>
                </>
              }
            />
            
            {/* New GP List Route*/}
            <Route
              path="/route-planning/route-list/gplist/:id"
              element={
                <>
                  <DefaultLayout>
                    <PageTitle title="Route GP List" />
                    <RouteGPList />
                  </DefaultLayout>
                </>
              }
            />
            
            {/*<Route
              path="/route-planning/reports"
              element={
                <>
                  <DefaultLayout>
                    <PageTitle title="Route Reports" />
                    <RouteReports />
                  </DefaultLayout>
                </>
              }
            />
            
            <Route
              path="/route-planning/audit-logs"
              element={
                <>
                  <DefaultLayout>
                    <PageTitle title="Route Audit Logs" />
                    <AuditLogs />
                  </DefaultLayout>
                </>
              }
            />*/}
            
            <Route
              path="/settings"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Settings" />
                  <Settings />
                  </DefaultLayout>
                </>
              }
            />
            <Route
              path="/chart"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Basic Chart" />
                  <Chart />
                  </DefaultLayout>
                </>
              }
            />
            <Route
              path="/ui/alerts"
              element={
                <>
                  <PageTitle title="Alerts" />
                  <Alerts />
                </>
              }
            />
            <Route
              path="/ui/buttons"
              element={
                <>
                  <PageTitle title="Buttons" />
                  <Buttons />
                </>
              }
            />
            <Route
              path="/master/states"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="States" />
                  <States />
                  </DefaultLayout>
                </>
              }
            />
             {/*<Route
              path="/master/district"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Districts" />
                  <Districts />
                  </DefaultLayout>
                </>
              }
            />
            <Route
              path="/master/blocks"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Blocks" />
                  <Blocks />
                  </DefaultLayout>
                </>
              }
            />*/}
            <Route
              path="/master/gpslist"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="GpList" />
                  <Gpslist />
                  </DefaultLayout>
                </>
              }
            />
             <Route
              path="/users"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Users" />
                  <Users />
                  </DefaultLayout>
                </>
              }
            />

             <Route
              path="/companies"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Companies" />
                   <CompaniesTable />
                  </DefaultLayout>
                </>
              }
            />

          <Route 
           path="/survey/bsnl-edit/:id" 
           element={
            <>
               <DefaultLayout>
              <PageTitle title="Bsnl Edit Form" />
              <BsnlEdit />
              </DefaultLayout>
            </>
           } 
           />
           <Route 
           path="/survey/gp-edit/:id" 
           element={
            <>
               <DefaultLayout>
              <PageTitle title="GP Edit Form" />
              <GpEdit />
              </DefaultLayout>
            </>
           } 
           />
           <Route 
           path="/survey/Aerail-edit/:id" 
           element={
            <>
               <DefaultLayout>
              <PageTitle title="Aerail Edit Form" />
              <AerialEdit />
              </DefaultLayout>
            </>
           } 
           />

            <Route
              path="/kmlfileupload"
              element={
                <>
                   <DefaultLayout>
                  <PageTitle title="Kml File Upload" />
                  <FileUpload />
                  </DefaultLayout>
                </>
              }
            />
            <Route path='/gp-points-filter' element={<>
                <DefaultLayout>
                  <PageTitle title="Filter GP Points" />
                  <KMLUpload />
                </DefaultLayout>
            </>}/>
            <Route path='/smart-inventory' element={<>
              
                  <SmartInventory />
            </>}/>
             <Route path='/depth-chart' element={<>
                <DefaultLayout>
                  <PageTitle title="depth chart" />
                  <IndexChart />
                </DefaultLayout>
            </>}/>
             <Route path='/machine-data' element={<>
                <DefaultLayout>
                  <PageTitle title="Machine-Data" />
                  <MachineDataTable />
                </DefaultLayout>
            </>}/>
              <Route path='/machine-management' element={<>
                <DefaultLayout>
                  <PageTitle title="machine-management" />
                  <MachineManagement />
                </DefaultLayout>
            </>}/>
            <Route path='/reports' element={<>
                <DefaultLayout>
                  <PageTitle title="Charts & Reports" />
                  <MainIndex />
                </DefaultLayout>
            </>}/>
              <Route path='/live-track' element={<>
                <DefaultLayout>
                  <PageTitle title="live-track" />
                  <LiveTrack />
                </DefaultLayout>
            </>}/>
             <Route path='/events-report' element={<>
                <DefaultLayout>
                  <PageTitle title="events-report" />
                  <Eventreport/>
                </DefaultLayout>
            </>}/>
             <Route path='/construction' element={<>
                <DefaultLayout>
                  <PageTitle title="construction" />
                  <Construction/>
                </DefaultLayout>
            </>}/>




          </Routes>
          
      )}
    </>
  );
}

export default App;