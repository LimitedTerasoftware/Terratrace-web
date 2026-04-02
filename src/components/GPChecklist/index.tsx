import { useState } from 'react';
import { Save, CheckCircle, Menu, X, Bell, Users } from 'lucide-react';
import Form1 from './forms/Form1';
import Form2 from './forms/Form2';
import Form3 from './forms/Form3';
import Form4 from './forms/Form4';
import Form5 from './forms/Form5';
import Form6 from './forms/Form6';
import Form7 from './forms/Form7';
import { FormData } from '../../types/gp-checklist';
import Sidebar from './Sidebar';

function App() {
  const [currentForm, setCurrentForm] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [completedForms, setCompletedForms] = useState<Set<number>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const updateFormData = (formNumber: number, data: Partial<FormData>) => {
    setFormData((prev) => ({
      ...prev,
      [`form${formNumber}`]: data,
    }));
  };

  const handleSaveDraft = () => {
    console.log('Saving draft...', formData);
    alert('Draft saved successfully!');
  };

  const handleSubmit = () => {
    const newCompleted = new Set(completedForms);
    newCompleted.add(currentForm);
    setCompletedForms(newCompleted);

    if (currentForm < 7) {
      setCurrentForm(currentForm + 1);
      alert(`Form ${currentForm} submitted successfully!`);
    } else {
      alert('All forms completed! Project submitted successfully.');
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
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Submit</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
