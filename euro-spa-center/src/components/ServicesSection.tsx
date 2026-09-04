import { ChevronRight } from 'lucide-react';
import { SERVICES_DATA } from '../data/spaData';
import { Service } from '../types';

interface ServicesSectionProps {
  onSelectService: (service: Service) => void;
  onViewAllServices: () => void;
}

export function ServicesSection({ onSelectService, onViewAllServices }: ServicesSectionProps) {
  return (
    <section id="section-services" className="px-4 py-5 border-b border-gray-100 bg-white">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          Our Signature Services
        </h2>
        <button
          id="btn-view-all-services"
          onClick={onViewAllServices}
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
        >
          <span>View All</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Services List / Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar snap-x">
        {SERVICES_DATA.map((service) => (
          <button
            key={service.id}
            id={`service-card-${service.id}`}
            onClick={() => onSelectService(service)}
            className="group shrink-0 w-36 sm:w-44 text-left bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:border-blue-300 hover:shadow-md transition-all active:scale-98 snap-start cursor-pointer focus:outline-none"
          >
            {/* Image */}
            <div className="relative h-24 sm:h-28 w-full overflow-hidden bg-gray-100">
              <img
                src={service.image}
                alt={service.name}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {service.popular && (
                <span className="absolute top-2 left-2 bg-blue-600 text-white text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-xs">
                  Popular
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {service.name}
              </h3>
              <p className="mt-0.5 text-[11px] sm:text-xs text-gray-500 font-medium">
                {service.durationRange}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

