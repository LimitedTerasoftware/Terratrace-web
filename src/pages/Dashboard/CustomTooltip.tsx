import React from 'react';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full bg-white text-sm shadow-lg border border-gray-200"
        style={{ pointerEvents: 'none' }}
      >
        <span className="text-gray-800 font-semibold">{item.value}</span>
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
