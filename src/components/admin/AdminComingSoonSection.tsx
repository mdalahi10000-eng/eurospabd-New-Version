import { Construction, Sparkles, ArrowRight } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface AdminComingSoonSectionProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onBackToDashboard: () => void;
}

export function AdminComingSoonSection({
  title,
  description,
  icon: Icon,
  onBackToDashboard
}: AdminComingSoonSectionProps) {
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
          <Icon className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
            <Construction className="w-3.5 h-3.5 text-amber-500" />
            <span>Under Active Development</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {title} Module
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Return to Dashboard Overview</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
