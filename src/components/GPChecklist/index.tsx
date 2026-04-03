import { useState } from 'react';
import { Save, CheckCircle, Menu, X, Bell, Users, Loader2 } from 'lucide-react';
import Form1 from './forms/Form1';
import Form2 from './forms/Form2';
import Form3 from './forms/Form3';
import Form4 from './forms/Form4';
import Form5 from './forms/Form5';
import Form6 from './forms/Form6';
import Form7 from './forms/Form7';
import type { FormData } from '../../types/gp-checklist';
import Sidebar from './Sidebar';
import axios from 'axios';

const BASEURL = import.meta.env.VITE_API_BASE;
const TraceBASEURL = import.meta.env.VITE_TraceAPI_URL;
const ImgbaseUrl = import.meta.env.VITE_Image_URL;

interface ImageUploadResponse {
  success: boolean;
  data: {
    images: string[];
  };
}

const uploadImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images[]', file);
  });

  try {
    const response = await fetch(`${BASEURL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: ImageUploadResponse = await response.json();
    return data.data.images || [];
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

const uploadDocs = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('docs[]', file);
  });

  try {
    const response = await fetch(`${BASEURL}/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data: ImageUploadResponse = await response.json();
    return data.data.images || [];
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

function App() {
  const [currentForm, setCurrentForm] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [completedForms, setCompletedForms] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (
    formNumber: number,
    data: Partial<FormData> | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [`form${formNumber}`]: data,
    }));
  };

  const handleSaveDraft = () => {
    console.log('Saving draft...', formData);
    alert('Draft saved successfully!');
  };

  const handleSubmit = async () => {
    if (!formData.form1) {
      alert('Please fill in Form 1');
      return;
    }

    setIsSubmitting(true);

    try {
      const f1 = formData.form1;

      const allImageFiles = [
        ...(f1.siteImages || []).map((img) => img.file),
        ...(f1.buildingImages || []).map((img) => img.file),
        ...(f1.qrCodeImages || []).map((img) => img.file),
        ...(f1.smartRackPhoto || []).map((img) => img.file),
        ...(f1.geotaggedSiteImages || []).map((img) => img.file),
      ];

      const uploadedImageUrls: string[] =
        allImageFiles.length > 0 ? await uploadImages(allImageFiles) : [];

      let imageIndex = 0;
      const siteImagesData = (f1.siteImages || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
      );
      const buildingImagesData = (f1.buildingImages || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
      );
      const qrCodeImagesData = (f1.qrCodeImages || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
      );
      const smartRackImagesData = (f1.smartRackPhoto || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
     
      );
      const geotaggedSiteImagesData = (f1.geotaggedSiteImages || []).map(
        () => uploadedImageUrls[imageIndex++] || '',
      );

      const pdfFiles = f1.otdrReport ? [f1.otdrReport] : [];
      const uploadedPdfUrls: string[] =
        pdfFiles.length > 0 ? await uploadDocs(pdfFiles) : [];

      const items = [
        {
          form_type: 'General verification form',
          item_name: 'Geo Tagged',
          status:
            f1.geoTaggedPhoto === 'yes'
              ? 1
              : f1.geoTaggedPhoto === 'no'
                ? 0
                : 0,
          images: geotaggedSiteImagesData,
         
        },
        {
          form_type: 'General verification form',
          item_name: 'QR Images',
          status: (f1.qrCodeImages?.length || 0) > 0 ? 1 : 0,
          images: qrCodeImagesData,
         
        },
        {
          form_type: 'General verification form',
          item_name: 'OTDR Report',
          status: f1.otdrReport ? 1 : 0,
          images: uploadedPdfUrls,
       
        },
        {
          form_type: 'General verification form',
          item_name: 'Board Installed',
          status:
            f1.siteBoardInstalled === 'yes'
              ? 1
              : f1.siteBoardInstalled === 'no'
                ? 0
                : 0,
         
          remark: f1.siteBoardRemark || '',
        },
        {
          form_type: 'General verification form',
          item_name: 'Smart Rack Installed',
          status:
            f1.smartRackInstalled === 'yes'
              ? 1
              : f1.smartRackInstalled === 'no'
                ? 0
                : 0,
          images: smartRackImagesData,
        
        },
      ];

      const payload = {
        gpData: {
          state_id: parseInt(f1.stateId || '0'),
          district_id: parseInt(f1.districtId || '0'),
          block_id: parseInt(f1.blockId || '0'),
          gp_id: f1.gpId || '',
          gp_name: f1.gpName || '',
          latitude: parseFloat(f1.latitude || '0'),
          longitude: parseFloat(f1.longitude || '0'),
          building_type: f1.building_type || '',
          site_images: siteImagesData,
          building_images: buildingImagesData,
        },
        items,
      };

      console.log('Submitting payload:', payload);

      await axios.post(`${TraceBASEURL}/submit-gp-checklist`, payload);
      const newCompleted = new Set(completedForms);
      newCompleted.add(currentForm);
      setCompletedForms(newCompleted);

      if (currentForm < 7) {
        setCurrentForm(currentForm + 1);
        alert(`Form ${currentForm} submitted successfully!`);
      } else {
        alert('All forms completed! Project submitted successfully.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = () => {
    switch (currentForm) {
      case 1:
        return (
          <Form1
            data={formData.form1}
            onChange={(data) => updateFormData(1, data)}
          />
        );
      case 2:
        return (
          <Form2
            data={formData.form2}
            onChange={(data) => updateFormData(2, data)}
          />
        );
      case 3:
        return (
          <Form3
            data={formData.form3}
            onChange={(data) => updateFormData(3, data)}
          />
        );
      case 4:
        return (
          <Form4
            data={formData.form4}
            onChange={(data) => updateFormData(4, data)}
          />
        );
      case 5:
        return (
          <Form5
            data={formData.form5}
            onChange={(data) => updateFormData(5, data)}
          />
        );
      case 6:
        return (
          <Form6
            data={formData.form6}
            onChange={(data) => updateFormData(6, data)}
          />
        );
      case 7:
        return (
          <Form7
            data={formData.form7}
            onChange={(data) => updateFormData(7, data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-300 rounded-lg shadow-md"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className="flex">
        <div
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-10 transition-transform duration-300 ease-in-out`}
        >
          <div className="h-screen sticky top-0">
            <Sidebar
              currentForm={currentForm}
              progress={completedForms.size}
              onFormChange={(formId) => {
                setCurrentForm(formId);
                setSidebarOpen(false);
              }}
              completedForms={completedForms}
            />
          </div>
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto p-6 sm:p-8 lg:p-12">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10 mb-6">
              {renderForm()}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                onClick={handleSaveDraft}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <Save className="w-5 h-5" />
                <span>Save as Draft</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
