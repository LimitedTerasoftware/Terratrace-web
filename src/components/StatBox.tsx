import React from "react";

interface StatBoxProps {
  title: string;
  rejected: number;
  pending: number;
  total: number;
  completed: number;
  onApprovedClick?: () => void;
  onPendingClick?: () => void;
  onRejectedClick?: () => void;
  onTotalClick?: () => void; 
}

const StatBox: React.FC<StatBoxProps> = ({ title, rejected, pending, total, completed, onApprovedClick,  onPendingClick, onRejectedClick, onTotalClick}) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md text-center border border-gray-200 cursor-pointer"
    >
      <h2 className="text-xl font-semibold text-blue-700">{title}</h2>

      <div className="mt-3 text-gray-600 flex flex-col items-center text-center justify-between space-y-2">

        {/* Total */}
         <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={onTotalClick}
          >
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <p>
              Total Surveyed: <span className="font-bold text-gray-800">{total}</span>
            </p>
          </div>

          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={onApprovedClick}
          >
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <p>
              Approved: <span className="font-bold text-gray-800">{completed}</span>
            </p>
          </div>

          {/* Pending */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={onPendingClick}
          >
            <span className="w-3 h-3 bg-orange-300 rounded-full"></span>
            <p>
              Pending: <span className="font-bold text-gray-800">{pending}</span>
            </p>
          </div>

          {/* Rejected */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={onRejectedClick}
          >
            <span className="w-3 h-3 bg-red-600 rounded-full"></span>
            <p>
              Rejected: <span className="font-bold text-gray-800">{rejected}</span>
            </p>
          </div>

      </div>
    </div>
  );
};

export default StatBox;
