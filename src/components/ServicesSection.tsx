import { ChevronRight } from 'lucide-react';
import { Service } from '../types';

interface ServicesSectionProps {
  onSelectService: (service: Service) => void;
  onViewAllServices: () => void;
  services?: Service[];
  loading?: boolean;
  error?: boolean;
}

export function ServicesSection({ 
  onSelectService, 
  onViewAllServices, 
  services = [],
  loading = false,
  error = false
}: ServicesSectionProps) {
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
      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar snap-x">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-36 sm:w-44 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs animate-pulse"
            >
              {/* Skeleton Image */}
              <div className="h-24 sm:h-28 w-full bg-gray-200" />
              {/* Skeleton Info */}
              <div className="p-3 space-y-2">
                <div className="h-3.5 bg-gray-200 rounded-md w-3/4" />
                <div className="h-2.5 bg-gray-200 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400">
          {error ? 'Unable to load services at this time.' : 'No services currently available.'}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar snap-x">
          {services.map((service) => (
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
                  alt={service.imageAlt || service.name}
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
      )}
    </section>
  );
}


