import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { getChecklistPreview } from '../../Services/api';
import { Header } from '../../Breadcrumbs/Header';

interface ChecklistItem {
  id: number;
  gp_main_id: number;
  gp_id: string | null;
  form_type: string;
  item_name: string;
  status: number;
  images: string | null;
  remark: string | null;
  item_type: string | null;
  created_at: string;
  updated_at: string;
}

interface ChecklistMain {
  id: number;
  state_id: number;
  district_id: number;
  block_id: number;
  gp_id: string;
  gp_name: string;
  latitude: string;
  longitude: string;
  site_images: string;
  building_images: string;
  building_type: string;
  user_id: string | null;
  status: number;
  created_at: string;
  updated_at: string;
  state_name: string;
  district_name: string;
  block_name: string;
}

const ImgbaseUrl = import.meta.env.VITE_Image_URL;

const parseMediaUrls = (raw: string | null): string[] => {
  if (!raw || typeof raw !== 'string') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

function GPChecklistView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [main, setMain] = useState<ChecklistMain | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getChecklistPreview(Number(id));
        if (response.status) {
          setMain(response.data.main);
          setItems(response.data.items);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.form_type]) {
        acc[item.form_type] = [];
      }
      acc[item.form_type].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>,
  );

  const parseStatus = (status: number) => {
    switch (status) {
      case 1:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <Check className="w-3 h-3" /> Completed
          </span>
        );
      case 0:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <X className="w-3 h-3" /> Pending
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
            <X className="w-3 h-3" /> Rejected
          </span>
        );
      
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  const getItemImages = (images: string | null) => {
    const urls = parseMediaUrls(images);
    if (urls.length === 0) return null;
    return urls.map((url) => `${ImgbaseUrl}${url}`);
  };

  const isVideoOrPdf = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ext === 'pdf' || ext === 'mp4' || ext === 'webm';
  };

  const InfoCard = ({
    title,
    icon: Icon,
    children,
  }: {
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  const DataRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-b-0">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <span className="text-sm text-gray-900 font-semibold">
        {value || 'N/A'}
      </span>
    </div>
  );
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/gp-checklist-list')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {zoomImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          {isVideoOrPdf(zoomImage) ? (
            <div className="bg-white p-4 rounded-lg">
              <a href={zoomImage} download className="text-blue-600 underline">
                Download {zoomImage.split('.').pop()?.toUpperCase()} File
              </a>
            </div>
          ) : (
            <img
              src={zoomImage}
              alt="Zoomed"
              className="max-w-full max-h-full p-4 rounded-lg"
            />
          )}
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        <Header activeTab="installation-gpchecklistview" BackBut={true} />


        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <InfoCard title="Location Details" icon={MapPin}>
              <div className="space-y-1">
                <DataRow label="State" value={main?.state_name || ''} />
                <DataRow label="District" value={main?.district_name || ''} />
                <DataRow label="Block" value={main?.block_name || ''} />
                <DataRow label="GP Name" value={main?.gp_name || ''} />
                <DataRow
                  label="Building Type"
                  value={main?.building_type || ''}
                />
                <DataRow label="Latitude" value={main?.latitude || ''} />
                <DataRow label="Longitude" value={main?.longitude || ''} />
              </div>
          </InfoCard>

            {main?.site_images && (
              <InfoCard title="Site Images" icon={ImageIcon}>
                <div className="grid grid-cols-2 gap-2">
                  {parseMediaUrls(main.site_images).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group cursor-pointer"
                      onClick={() => setZoomImage(`${ImgbaseUrl}${url}`)}
                    >
                      <div className="w-full h-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={`${ImgbaseUrl}${url}`}
                          alt={`Site Image ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}

            {main?.building_images && (
              <InfoCard title="Building Images" icon={ImageIcon}>
                <div className="grid grid-cols-2 gap-2">
                  {parseMediaUrls(main.building_images).map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group cursor-pointer"
                      onClick={() => setZoomImage(`${ImgbaseUrl}${url}`)}
                    >
                      <div className="w-full h-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={`${ImgbaseUrl}${url}`}
                          alt={`Building Image ${idx + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Checklist Items
          </h2>
          <div className="grid grid-cols-1 gap-6">
            {Object.entries(groupedItems).map(([formType, formItems]) => (
              <div
                key={formType}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-600 to-blue-950 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">
                    {formType}
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {formItems.map((item) => {
                      const images = getItemImages(item.images);
                      return (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.item_name}
                            </h4>
                            {parseStatus(item.status)}
                          </div>
                          {item.item_type && (
                            <p className="text-xs text-gray-500 mb-2">
                              Type: {item.item_type}
                            </p>
                          )}
                          {item.remark && (
                            <p className="text-xs text-gray-600 mb-2 italic">
                              Remark: {item.remark}
                            </p>
                          )}
                          {images && images.length > 0 && (
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {images.map((img, idx) => {
                                  const isFile = isVideoOrPdf(img);
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setZoomImage(img)}
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      {isFile
                                        ? `File ${idx + 1}`
                                        : `Image ${idx + 1}`}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default GPChecklistView;
