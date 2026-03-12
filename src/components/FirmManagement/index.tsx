import React, { useState, useEffect } from 'react';
import { Firm, FirmFormData } from '../../types/firm';
import FirmForm from './FirmForm';
import FirmList from './FirmList';
import { Plus, Building2 } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import Modal from '../hooks/ModalPopup';
import { getFirms } from '../Services/api';
import { Link } from 'react-router-dom';

interface ModalData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
interface ApiErrorResponse {
  error?: string;
  status?: string;
}

function FirmManagement() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [editingFirm, setEditingFirm] = useState<Firm | undefined>(undefined);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData>({
    title: '',
    message: '',
    type: 'info',
  });

  useEffect(() => {
    getFirms().then((data) => {
      setFirms(data);
    });
  }, []);

  const handleAddFirm = async (formData: FirmFormData) => {
    try {
      const resp = await axios.post(`${TraceBASEURL}/create-firm`, formData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (resp.status === 200 || resp.status === 201) {
        setModalData({
          title: 'Success!',
          message: 'Firm added successfully.',
          type: 'success',
        });

        getFirms().then((data) => {
          setFirms(data);
        });
      } else {
        setModalData({
          title: 'Error!',
          message: resp.data || 'Unexpected response',
          type: 'error',
        });
      }
    } catch (error) {
      const err = error as AxiosError;
      const errorData = err.response?.data as ApiErrorResponse;
      setModalData({
        title: 'Error!',
        message: errorData?.error || err.message || 'Unexpected response',
        type: 'error',
      });
    } finally {
      setIsFormModalOpen(false);
      setModalOpen(true);
    }
  };

  const handleEditFirm = async (formData: FirmFormData) => {
    if (editingFirm) {
      try {
          const payload = {
        ...formData,
        id: editingFirm.id,
      };
        const response = await axios.post(
          `${TraceBASEURL}/update-firm`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
        if (response.status === 200 || response.status === 201) {
          getFirms().then((data) => {
            setFirms(data);
          });
          setModalData({
            title: 'Success!',
            message: 'Firm updated successfully.',
            type: 'success',
          });
        } else {
          setModalData({
            title: 'Error!',
            message: response.data.error || 'Unexpected response',
            type: 'error',
          });
        }
      } catch (error) {
        const err = error as AxiosError;
        const errorData = err.response?.data as ApiErrorResponse;

        setModalData({
          title: 'Error!',
          message: errorData.error || 'Unexpected error occurred',
          type: 'error',
        });
      } finally {
        setEditingFirm(undefined);
        setIsFormModalOpen(false);
        setModalOpen(true);
      }
    }
  };

 
  const handleAddNewFirm = () => {
    setEditingFirm(undefined);
    setIsFormModalOpen(true);
  };

  const handleStartEdit = (firm: Firm) => {
    setEditingFirm(firm);
    setIsFormModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingFirm(undefined);
    setIsFormModalOpen(false);
  };




  const FirmHeader = () => {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200 px-7 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-400">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Firm Management
              </h1>
              <p className="text-sm text-gray-600">
                Manage firm details and authorized persons
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>Total Count <span className='font-bold'>{firms.length}</span>
                 
             </div>
            <button
              onClick={handleAddNewFirm}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add New Firm
            </button>

            <nav>
              <ol className="flex items-center gap-2">
               <li>
                  <Link className="font-medium" to="/dashboard">
                    Dashboard /
                  </Link>
                </li>
                <li className="font-medium text-primary">Firm Management</li>
              </ol>
            </nav>
          </div>
        </div>
      </header>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FirmHeader />
      <div className="px-1">
        <div className="space-y-8">
          <FirmList
            firms={firms}
            onEdit={handleStartEdit}
          />
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          title={modalData.title}
          message={modalData.message}
          type={modalData.type}
        />

        {isFormModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <FirmForm
                firm={editingFirm}
                onSubmit={editingFirm ? handleEditFirm : handleAddFirm}
                onCancel={handleCancelEdit}
                isEditing={!!editingFirm}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FirmManagement;
