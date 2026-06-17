import { ClipboardList, Wrench, CheckSquare, Layers, HardHat, ShieldCheck, UserCheck, BadgeCheck, Tag } from 'lucide-react';

interface ProgressBarProps {
  value: number;
  color: string;
}

function ProgressBar({ value, color }: ProgressBarProps) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
      <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

function FlowItem({
  icon,
  iconBg,
  title,
  sub,
  badge,
  badgeColor,
  progress,
  progressColor,
  muted,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  sub: string;
  badge?: string;
  badgeColor?: string;
  progress?: number;
  progressColor?: string;
  muted?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${muted ? 'opacity-50' : 'bg-white'} border border-gray-100`}>
      <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-semibold ${muted ? 'text-gray-400' : 'text-gray-800'}`}>{title}</p>
          {badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: badgeColor, backgroundColor: badgeColor + '1a' }}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
        {progress !== undefined && progressColor && <ProgressBar value={progress} color={progressColor} />}
      </div>
    </div>
  );
}

export default function FlowCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Installation Flow */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Installation Flow</h3>
          <span className="text-[10px] font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">ACTIVE</span>
        </div>
        <div className="space-y-2">
          <FlowItem
            icon={<ClipboardList size={16} className="text-emerald-600" />}
            iconBg="#d1fae5"
            title="GP/Block Survey"
            sub="3104 / 4289   128 Rej"
            badge="72%"
            badgeColor="#22c55e"
            progress={72}
            progressColor="#22c55e"
          />
          <FlowItem
            icon={<Wrench size={16} className="text-orange-500" />}
            iconBg="#ffedd5"
            title="Installation"
            sub="2105 / 4289   +12 Today"
            badge="40%"
            badgeColor="#f59e0b"
            progress={40}
            progressColor="#f59e0b"
          />
          <FlowItem
            icon={<CheckSquare size={16} className="text-gray-400" />}
            iconBg="#f3f4f6"
            title="Checklist / HOTO Ready"
            sub="Pending Approval: 428"
            muted
          />
        </div>
      </div>

      {/* Construction Flow */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">Construction Flow</h3>
        </div>
        <div className="space-y-2">
          <FlowItem
            icon={<Layers size={16} className="text-blue-600" />}
            iconBg="#dbeafe"
            title="UG / Aerial Survey"
            sub="Approved: 5,420 KM"
            badge="88%"
            badgeColor="#22c55e"
            progress={88}
            progressColor="#22c55e"
          />
          <FlowItem
            icon={<HardHat size={16} className="text-blue-600" />}
            iconBg="#dbeafe"
            title="Construction"
            sub="2,400 KM Completed   +4.2 KM Today"
            badge="In Progress"
            badgeColor="#3b82f6"
            progress={39}
            progressColor="#3b82f6"
          />
          <FlowItem
            icon={<ShieldCheck size={16} className="text-gray-600" />}
            iconBg="#f3f4f6"
            title="Quality Control (QC)"
            sub="QC Passed: 1,840 KM"
            progress={30}
            progressColor="#6b7280"
          />
        </div>
      </div>

      {/* HOTO Flow */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">HOTO Flow</h3>
        </div>
        <div className="space-y-2">
          <FlowItem
            icon={<UserCheck size={16} className="text-blue-600" />}
            iconBg="#dbeafe"
            title="HOTO Survey"
            sub="Pending: 1,152 | Done: 45"
          />
          <FlowItem
            icon={<ShieldCheck size={16} className="text-gray-500" />}
            iconBg="#f3f4f6"
            title="Verification"
            sub="Waiting for Field Auditor"
          />
          <FlowItem
            icon={<Tag size={16} className="text-emerald-600" />}
            iconBg="#d1fae5"
            title="Acceptance / Closure"
            sub="Total Accepted: 12"
          />
        </div>
      </div>
    </div>
  );
}
