import { useState, useEffect } from 'react';
import { X, Save, Loader2, ArrowUpDown } from 'lucide-react';
import { reorderSurvey } from '../Services/api';
import { Activity } from '../../types/survey';

interface ReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveyId: number;
  eventData: Activity[];
  onSuccess: () => void;
}

interface ReorderItem {
  id: number;
  order_index: number;
}

const ReorderModal: React.FC<ReorderModalProps> = ({
  isOpen,
  onClose,
  surveyId,
  eventData,
  onSuccess,
}) => {
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && eventData.length > 0) {
      const sortedItems = [...eventData]
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map((item) => ({
          id: item.id,
          order_index: item.order_index || 0,
        }));
      setItems(sortedItems);
    }
  }, [isOpen, eventData]);

  const handleOrderChange = (id: number, newIndex: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, order_index: newIndex } : item,
      ),
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      await reorderSurvey(surveyId, items);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reorder survey');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5" />
            Edit Order Index
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-12 gap-4 font-semibold text-sm bg-gray-100 p-2 rounded mb-2">
            <div className="col-span-3">Event ID</div>
            <div className="col-span-5">Event Type</div>
            <div className="col-span-4">Order Index</div>
          </div>

          {items.map((item) => {
            const eventItem = eventData.find((e) => e.id === item.id);
            return (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 p-2 border-b items-center hover:bg-gray-50"
              >
                <div className="col-span-3 text-sm font-medium">{item.id}</div>
                <div className="col-span-5 text-sm text-gray-600">
                  {eventItem?.eventType || '-'}
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    min={1}
                    value={item.order_index}
                    onChange={(e) =>
                      handleOrderChange(item.id, parseInt(e.target.value) || 0)
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReorderModal;
