import { ChevronDown, ChevronUp } from 'lucide-react';
import { FormStep } from '../../types/gp-checklist';

interface SidebarProps {
  currentForm: number;
  progress: number;
  onFormChange: (formId: number) => void;
  completedForms: Set<number>;
}

const formSteps: FormStep[] = [
  {
    id: 1,
    title: 'Form 1 - General Site Verification',
    shortTitle: 'General Site',
  },
  {
    id: 2,
    title: 'Form 2 - OFC and Connectivity',
    shortTitle: 'OFC & Connectivity',
  },
  { id: 3, title: 'Form 3 - Equipment Installation', shortTitle: 'Equipment' },
  {
    id: 4,
    title: 'Form 4 - Power Earthing Verification',
    shortTitle: 'Power & Earthing',
  },
  {
    id: 5,
    title: 'Form 5 - GIS Mapping Verification',
    shortTitle: 'GIS Mapping',
  },
  {
    id: 6,
    title: 'Form 6 - Safe Quality Verification',
    shortTitle: 'Safe Quality',
  },
  {
    id: 7,
    title: 'Form 7 - Final Acceptance Verification',
    shortTitle: 'Final Acceptance',
  },
];

export default function Sidebar({
  currentForm,
  progress,
  onFormChange,
  completedForms,
}: SidebarProps) {
  return (
    <div className="w-72 bg-white border-r border-gray-200 h-fit flex-shrink-0">
      <div className="p-6 h-full overflow-y-auto">
        <h1 className="text-2xl font-semibold text-blue-600 mb-1">
          GP Checklist
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Telecom Project Verification
        </p>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-gray-900">
              {progress} / 7
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress / 7) * 100}%` }}
            />
          </div>
        </div>

        <nav className="space-y-2">
          {formSteps.map((step) => {
            const isActive = currentForm === step.id;
            const isCompleted = completedForms.has(step.id);

            return (
              <button
                key={step.id}
                onClick={() => onFormChange(step.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                    : 'border-2 border-transparent hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}
                  >
                    {step.title}
                  </span>
                  {isActive ? (
                    <ChevronUp className="w-4 h-4 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  )}
                </div>
                {isCompleted && !isActive && (
                  <div className="mt-1">
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Completed
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
