import React, { useEffect, useState } from 'react';
import { FilterState } from '../../../types/survey';
import { getMachineOptions } from '../../Services/api';
import { getLastMonthFromDate, getLastMonthToDate, getLastWeekDate, getLastWeekFromDate, getLastWeekToDate, getThisMonthFromDate, getThisMonthToDate, getThisWeekFromDate, getTodayDate } from '../../../utils/dateUtils';
import SearchableSelect from '../../Forms/SearchableSelect';

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
    const [selectedtab,setSelectedTab]=useState<string>('');
    const tabs =[
        {label:'All Data', value:''},
        {label:'This Week',value:'1'},
        {label:'Last Week',value:'2'},
        {label:'This Month',value:"3"},
        {label:'Last Month',value:"4"}
    ]
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
    useEffect(()=>{
        if(selectedtab === '1'){
         onFiltersChange({
            ...filters,
           fromDate : getThisWeekFromDate(),
           toDate:getTodayDate()
        });
        }else if(selectedtab === '2'){
           onFiltersChange({
            ...filters,
           fromDate : getLastWeekFromDate(),
           toDate:getLastWeekToDate()
        });
        }else if(selectedtab === '3'){
        onFiltersChange({
            ...filters,
           fromDate : getThisMonthFromDate(),
           toDate:getThisMonthToDate()
        });
        }else if(selectedtab === '4'){
        onFiltersChange({
            ...filters,
           fromDate:getLastMonthFromDate(),
           toDate:getLastMonthToDate()
        });
        }

    },[selectedtab])
    useEffect(()=>{
       onApplyFilters();
    },[filters])
   return (
        <div className="flex flex-wrap items-center gap-1">
                <div className="relative flex-1 min-w-0 sm:flex-none sm:w-32">
                 
                    <SearchableSelect
                        value={filters.machineId}
                        onChange={(selectedId) => {
                            const selectedMachine = machineOptions.find(
                            (m) => m.machine_id == selectedId
                            );
                            handleInputChange('machineId', selectedId, selectedMachine?.registration_number || '');
                        }}
                        options={machineOptions.map((machine: { machine_id: string; registration_number: string }) => ({
                            value: String(machine.machine_id),
                            label: machine.registration_number,
                        }))}
                    />
                </div>

                {filters.month === undefined? (
                <><div className="relative flex-1 min-w-0 sm:flex-none sm:w-32">

                   <SearchableSelect
                       value={selectedtab}
                       onChange={(value) => {
                           setSelectedTab(value);

                       } }
                       options={tabs
                           .filter((tab) => tab.value !== '')
                           .map((tab) => ({
                               value: tab.value,
                               label: tab.label,
                           }))}
                       placeholder="All Data"
                   />
               </div><div className="relative flex-1 min-w-0 sm:flex-none sm:w-32">

                       <input
                           type="date"
                           value={filters.fromDate}
                           onChange={(e) => handleInputChange('fromDate', e.target.value)}
                           className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                   </div><div className="relative flex-1 min-w-0 sm:flex-none sm:w-32">

                       <input
                           type="date"
                           value={filters.toDate}
                           onChange={(e) => handleInputChange('toDate', e.target.value)}
                           className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                   </div></>
                ):(
                    <div className="relative flex-1 min-w-0 sm:flex-none sm:w-32">

                    <input
                            type="month"
                            value={`${filters.year}-${filters.month.toString().padStart(2, '0')}`}
                            onChange={(e) => {
                                const [year, month] = e.target.value.split('-');
                                onFiltersChange ({
                                ...filters,
                                year: parseInt(year),
                                month: parseInt(month),
                                });
                            }}
                             className="w-full appearance-none px-1 py-2  text-sm bg-white border border-gray-300 rounded-md shadow-sm outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />

                   
                </div> 
                )}


                {/* <div className="relative flex-1 min-w-0 sm:flex-none sm:w-30">
                    <button
                        onClick={onApplyFilters}
                        disabled={isLoading}
                        className="w-full px-1 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                        {isLoading ? 'Loading...' : 'Apply Filters'}
                    </button>
                </div> */}
        </div>
       
    );
};

export default FilterPanel;