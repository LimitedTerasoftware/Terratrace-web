import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info";
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type = "info" }) => {
  if (!isOpen) return null;

  const typeColors = {
    success: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`rounded-lg p-6 max-w-sm w-full shadow-lg ${typeColors[type]} transition-all`}>
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="mb-4">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
