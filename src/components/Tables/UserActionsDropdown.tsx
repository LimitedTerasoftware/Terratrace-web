import { useState } from "react";
import { FaEllipsisV, FaEdit } from "react-icons/fa";

interface ActionsDropdownProps {
  row: { original: any };
  isActive: boolean;
  openEditModal: (data: any) => void;
  handleStatusChange: () => void;
}

const UserActionsDropdown: React.FC<ActionsDropdownProps> = ({ row, isActive, openEditModal, handleStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded hover:bg-gray-100"
      >
        <FaEllipsisV className="h-5 w-5 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 shadow-lg rounded-md z-10">
          <button
            onClick={() => {
              openEditModal(row.original);
              setIsOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            <FaEdit className="mr-2" /> Edit
          </button>
          <button
            onClick={() => {
              handleStatusChange();
              setIsOpen(false);
            }}
            className={`flex items-center w-full px-4 py-2 ${
              isActive ? "text-orange-500" : "text-green-500"
            } hover:bg-gray-100`}
          >
            {isActive ? "Set Inactive" : "Set Active"}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserActionsDropdown;
