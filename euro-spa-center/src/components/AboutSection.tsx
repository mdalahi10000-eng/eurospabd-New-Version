import { ShieldCheck, UserCheck, Sparkles, Lock } from 'lucide-react';
import { SPA_INFO } from '../data/spaData';

export function AboutSection() {
  const highlights = [
    {
      id: 'hygiene',
      icon: ShieldCheck,
      title: 'Hygienic Treatment Rooms'
    },
    {
      id: 'therapists',
      icon: UserCheck,
      title: 'Professional Therapists'
    },
    {
      id: 'experience',
      icon: Sparkles,
      title: 'Premium Spa Experience'
    },
    {
      id: 'private',
      icon: Lock,
      title: 'Private & Comfortable'
    }
  ];

  return (
    <section id="section-overview" className="px-4 py-5 border-b border-gray-100 bg-white">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Left Column: Description */}
        <div className="md:col-span-6 lg:col-span-7">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            About {SPA_INFO.name}
          </h2>
          <p className="mt-2 text-gray-600 leading-relaxed text-sm sm:text-base">
            {SPA_INFO.description}
          </p>
        </div>

        {/* Right Column: Highlights Card matching Clean Minimalism */}
        <div className="md:col-span-6 lg:col-span-5 bg-gray-50/70 rounded-2xl border border-gray-200/90 p-4">
          <div className="space-y-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

