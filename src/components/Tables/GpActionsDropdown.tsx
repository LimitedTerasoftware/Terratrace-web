import { useState } from "react";
import { FaEllipsisV, FaEdit, FaEye, FaTrash, FaCheck, FaTimes } from "react-icons/fa";

interface ActionsDropdownProps {
  row: { original: any };
  handleEdit: (id: string) => void;
  handleView: (id: string) => void;
  handleDelete: (id: string) => void;
  handleAccept: (id: string) => void;
  handleReject: (id: string) => void;
}

const GpActionsDropdown: React.FC<ActionsDropdownProps> = ({ row, handleEdit, handleView, handleDelete, handleAccept, handleReject }) => {
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
        <div className="absolute left-0 mt-2 w-40 text-gray bg-white border border-gray-200 shadow-lg rounded-md z-10">
          
          <button
            onClick={() => {
              handleView(row.original.id);
              setIsOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-green-500 hover:bg-gray-100"
          >
            <FaEye className="mr-2" /> View
          </button>
        </div>
      )}
    </div>
  );
};

export default GpActionsDropdown;
