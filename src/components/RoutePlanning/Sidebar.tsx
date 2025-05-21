import React from 'react';
import { useAppContext } from './AppContext';
import TransportModes from './Sidebar/TransportModes';
import FileUpload from './Sidebar/FileUpload';
import ModeToggle from './Sidebar/ModeToggle';
import PointDetails from './Sidebar/PointDetails';

// *****Related to the bulk Upload Modal*****
// Import the BulkUploadModal component for file pair uploads
import BulkUploadModal from './Sidebar/BulkUploadModal';

import { ChevronLeft, ChevronRight, Car, Bike, PersonStanding, Upload } from 'lucide-react';
import Tricad from '../../images/logo/Tricad.png';

const modes = ['car', 'bike', 'walk'] as const;
type Mode = typeof modes[number]; 

const Sidebar: React.FC = () => {
    // *****Related to the bulk Upload Modal*****
    // Destructure bulk upload modal state and setter from the AppContext
    const { 
        isSidebarOpen, 
        toggleSidebar, 
        transportMode, 
        setTransportMode,
        
        // Bulk upload modal related props from context
        isBulkUploadModalOpen, 
        setBulkUploadModalOpen 
    } = useAppContext();

    return (
        <>
            {/* 
            // *****Related to the bulk Upload Modal*****
            // Render the BulkUploadModal component with props from context
            // isOpen: Controls visibility based on context state
            // onClose: Uses context setter to hide the modal when closed
            */}
            <BulkUploadModal 
                isOpen={isBulkUploadModalOpen} 
                onClose={() => setBulkUploadModalOpen(false)} 
            />

            <aside
                className={`fixed top-0 bottom-0 left-0 w-80 bg-white border-r border-gray-200 overflow-y-auto 
                transform transition-transform duration-300 ease-in-out z-20
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0'}`}
            >
                <div className="bg-blue-950 px-4 py-3 flex items-center justify-between">
                    <img src={Tricad} alt="Logo" className="w-[180px] ml-10" />
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-md hover:bg-gray-100 transition-colors md:hidden"
                        aria-label="Close sidebar"
                    >
                        <ChevronLeft size={20} color="white" />
                    </button>
                </div>

                <div className={`p-4 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
                    <div className="mb-6">
                        <div className="flex items-center justify-between gap-2">

                            {/* Transport Modes */}
                           <div className="flex items-center gap-1">
                            {modes.map((mode: Mode) => {
                                const Icon = mode === 'car' ? Car : mode === 'bike' ? Bike : PersonStanding;
                                return (
                                <button
                                    key={mode}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                    transportMode === mode ? 'bg-blue-500' : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                    onClick={() => setTransportMode(mode)}
                                    aria-label={mode}
                                >
                                    <Icon size={18} className={transportMode === mode ? 'text-white' : 'text-gray-600'} />
                                </button>
                                );
                            })}
                            </div>

                            {/* Upload Buttons */}
                            <div className="flex items-center gap-1">
                                {/* KML Upload */}
                                {/* <div className="relative">
                                    <input
                                        type="file"
                                        id="KML"
                                        className="hidden"
                                        // onChange={(e) => setGpFile(e.target.files?.[0] || null)}
                                        accept=".kml,.txt"
                                    />
                                    <label
                                        htmlFor="KML"
                                        className="text-[10px] px-2 py-2 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition-all"
                                    >
                                        KML_Upload
                                    </label>
                                </div> */}

                                {/* 
                                // *****Related to the bulk Upload Modal*****
                                // Label that opens the bulk upload modal when clicked
                                // Uses the context setter to show the modal
                                */}
                                <div className="relative">
                                    <label
                                        className="text-[10px] px-2 py-2 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition-all"
                                        onClick={() => setBulkUploadModalOpen(true)}
                                    >
                                        Bulk_Upload
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                

                    <FileUpload/>
                    <ModeToggle />
                    <PointDetails />
                </div>
            </aside>


            {/* Toggle button for larger screens */}
            <button
                onClick={toggleSidebar}
                className={`fixed top-4 left-4 z-30 p-2 bg-white  rounded-full shadow-md hover:bg-gray-50 transition-all duration-300 hidden md:flex ${isSidebarOpen ? 'translate-x-72' : 'translate-x-0'
                    }`}
                aria-label="Toggle sidebar"
            >
                {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
        </>
    );
};

export default Sidebar;