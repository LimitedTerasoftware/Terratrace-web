import React from "react";
import { FaTasks, FaChartPie, FaClipboardCheck, FaCheckCircle } from "react-icons/fa";

interface StatBoxProps {
  title: string;
  active: number;
  inactive: number;
  total: number;
}

const UserStatBox: React.FC<StatBoxProps> = ({ title, active, inactive, total }) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md text-center border border-gray-200">
    <h2 className="text-xl font-semibold text-blue-700">{title}</h2>

    <div className="mt-3 text-gray-600 flex flex-col items-center text-center justify-between space-y-2">

      {/* Total */}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
        <p>
          Total: <span className="font-bold text-gray-800">{total}</span>
        </p>
      </div>

      {/* Approved */}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
        <p>
          Active: <span className="font-bold text-gray-800">{active}</span>
        </p>
      </div>

      {/* Pending */}
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 bg-orange-300 rounded-full"></span>
        <p>
          In-Active: <span className="font-bold text-gray-800">{inactive}</span>
        </p>
      </div>

    </div>
  </div>
  );
};

export default UserStatBox;
