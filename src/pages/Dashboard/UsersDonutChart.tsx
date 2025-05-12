import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import CustomTooltip from './CustomTooltip';




const UsersDonutChart = ({UserData}:any) => {

const data = [
  { name: 'Active', value: UserData?.activeUsers || 0, color: '#4F46E5' },
  { name: 'In-Active', value:UserData?.inactiveUsers || 0 , color: '#F97316' },
];

  return (
      <div className="flex items-center">
        {/* Left Legend */}
        <div className="space-y-2 mr-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#22C55E]" />
            <span className="text-sm text-gray-700"><b>Total: {UserData?.allUsers || Number(UserData?.activeUsers) + Number(UserData?.inactiveUsers)}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#4F46E5]" />
            <span className="text-sm text-gray-700"><b>Active: {UserData?.activeUsers || 0}</b></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F97316]" />
            <span className="text-sm text-gray-700"><b>In-Active: {UserData?.inactiveUsers || 0}</b></span>
          </div>
        </div>

        {/* Donut Chart */}
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              labelLine={false}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
  );
};

export default UsersDonutChart;
