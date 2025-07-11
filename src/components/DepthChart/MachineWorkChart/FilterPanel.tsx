import React, { useEffect, useState } from 'react';
import { FilterState } from '../../../types/survey';
import { getMachineOptions } from '../../Services/api';

interface FilterPanelProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onApplyFilters: () => void;
    isLoading: boolean;
}
interface Machine {
    machine_id: string;
    registration_number: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
    filters,
    onFiltersChange,
    onApplyFilters,
    isLoading,
}) => {
    const [machineOptions, setMachineOptions] = useState<Machine[]>([]);

    useEffect(() => {
        getMachineOptions().then(data => {
            setMachineOptions(data);
        });
    }, []);


    const handleInputChange = (field: keyof FilterState, value: string, label?:string) => {
        
        onFiltersChange({
            ...filters,
            [field]: value,
            ...(label ? { machineName: label } : {})

        });
        // onApplyFilters();
    };


    return (
        <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">

                    <select
                        value={filters.machineId}
                        onChange={(e) => {
                            const selectedId = e.target.value;
                            const selectedMachine = machineOptions.find(
                            (m) => m.machine_id == selectedId
                            );
                            handleInputChange('machineId', selectedId, selectedMachine?.registration_number || '');
                        }}                        
                        className="w-full appearance-none px-3 py-2 pr-8 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                       {machineOptions.map((machine: { machine_id: string; registration_number: string }) => (
                            <option key={machine.machine_id} value={machine.machine_id}>
                                {machine.registration_number}
                            </option>
                        ))}

                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>


                {/* <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">

                    <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => handleInputChange('fromDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">

                    <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => handleInputChange('toDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div> */}


                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-36">
                    <button
                        onClick={onApplyFilters}
                        disabled={isLoading}
                        className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isLoading ? 'Loading...' : 'Apply Filters'}
                    </button>
                </div>
        </div>
       
    );
};

export default FilterPanel;