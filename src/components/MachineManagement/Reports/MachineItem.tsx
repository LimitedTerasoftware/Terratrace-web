import { useState, useEffect } from 'react';
import { Building2, FileText, User, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { MachineDataReport, MachineLinkStats } from '../../../types/machine';
import { machineApi } from '../../Services/api';

interface MachineItemProps {
  machine: MachineDataReport;
  searchQuery: string;
  selectedState: string;
  selectedDistrict: string;
  selectedBlock: string;
  fromDate: string;
  toDate: string;
}

type SortField = 'state' | 'district' | 'block' | 'link_name' | 'total_links' | 'total_distance_meters' | 'total_days' | 'avg_distance_per_day';
type SortDirection = 'asc' | 'desc';

export default function MachineItem({
  machine,
  searchQuery,
  selectedState,
  selectedDistrict,
  selectedBlock,
  fromDate,
  toDate,
}: MachineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [linkStats, setLinkStats] = useState<MachineLinkStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState<SortField>('state');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    if (isExpanded && linkStats.length > 0) {
      fetchLinkStats();
    }
  }, [selectedState, selectedDistrict, selectedBlock, fromDate, toDate]);

  const fetchLinkStats = async () => {
    setLoading(true);
    try {

      const response = await machineApi.getMachineLinkStats(
        machine.machine_id,
        selectedState || undefined,
        selectedDistrict || undefined,
        selectedBlock || undefined,
        fromDate || undefined,
        toDate || undefined
      );
      setLinkStats(response.data);
    } catch (error) {
      console.error('Failed to fetch link stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async () => {
    if (!isExpanded && linkStats.length === 0) {
      await fetchLinkStats();
    }
    setIsExpanded(!isExpanded);
  };


  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getFilteredAndSortedData = () => {
    let filtered = [...linkStats];

    if (selectedState) {
      filtered = filtered.filter((item) => item.state === selectedState);
    }

    if (selectedDistrict) {
      filtered = filtered.filter((item) => item.district === selectedDistrict);
    }

    if (selectedBlock) {
      filtered = filtered.filter((item) => item.block === selectedBlock);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.state.toLowerCase().includes(query) ||
          item.district.toLowerCase().includes(query) ||
          item.block.toLowerCase().includes(query) ||
          item.link_name.toLowerCase().includes(query) ||
          item.total_links.toString().includes(query) 
      );
    }

    filtered.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === 'total_distance_meters' || sortField === 'avg_distance_per_day') {
        aValue = parseFloat(aValue as string);
        bValue = parseFloat(bValue as string);
      }

      if (sortField === 'total_days') {
        aValue = a.total_days;
        bValue = b.total_days;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredData = getFilteredAndSortedData();
  const totalLinks = filteredData.length;

  const SortIcon = ({ field }: { field: SortField }) => (
    <button
      onClick={() => handleSort(field)}
      className="ml-1 inline-flex items-center hover:text-gray-900"
    >
      <ArrowUpDown className="w-4 h-4" />
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <button
        onClick={handleExpand}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-6 flex-1">
          <div className="bg-blue-50 p-3 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>

          <div className="text-left">
            <p className="text-xs text-gray-500 mb-1">Firm Name</p>
            <p className="font-semibold text-gray-900">{machine.firm_name}</p>
          </div>

          <div className="bg-violet-50 p-3 rounded-lg">
            <FileText className="w-5 h-5 text-violet-600" />
          </div>

          <div className="text-left">
            <p className="text-xs text-gray-500 mb-1">Registration Number</p>
            <p className="font-medium text-gray-900">{machine.registration_number}</p>
          </div>

          <div className="bg-green-50 p-3 rounded-lg">
            <User className="w-5 h-5 text-green-600" />
          </div>

          <div className="text-left">
            <p className="text-xs text-gray-500 mb-1">Authorized Person</p>
            <p className="font-medium text-gray-900">{machine.authorised_person}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-blue-600">{totalLinks ? `${totalLinks} ` : ''}Links</span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      State
                      <SortIcon field="state" />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      District
                      <SortIcon field="district" />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Block
                      <SortIcon field="block" />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Link Name
                      <SortIcon field="link_name" />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Total Links
                      <SortIcon field="total_links" />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Total Distance (m)
                      <SortIcon field="total_distance_meters" />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Total Days
                      <SortIcon field="total_days" />
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">
                      Avg Distance/Day
                      <SortIcon field="avg_distance_per_day" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((stat, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{stat.state}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{stat.district}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{stat.block}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{stat.link_name}</td>
                     <td className="py-3 px-4 text-sm text-gray-900">{stat.total_links}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {stat.total_distance_meters}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{stat.total_days} Days</td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {stat.avg_distance_per_day} m/day
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No data found matching the current filters
            </div>
          )}
        </div>
      )}
    </div>
  );
}
