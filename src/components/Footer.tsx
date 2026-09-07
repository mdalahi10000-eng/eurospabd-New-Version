import { SPA_INFO } from '../data/spaData';
import { navigate } from '../router';
import { BusinessInfo, ServiceArea } from '../types';

interface FooterProps {
  onWhatsAppClick?: () => void;
  businessInfo?: BusinessInfo;
  serviceAreas?: ServiceArea[];
}

export function Footer({ onWhatsAppClick, businessInfo, serviceAreas }: FooterProps) {
  const name = businessInfo?.businessName || SPA_INFO.name;
  const facebookUrl = businessInfo?.socialProfiles.facebook || 'https://www.facebook.com/profile.php?id=61592822445077';
  const instagramUrl = businessInfo?.socialProfiles.instagram || 'https://www.instagram.com/euro.spa.center/';
  const whatsappNum = businessInfo?.whatsappNumber || SPA_INFO.whatsappNumber;

  const handleWhatsApp = () => {
    if (onWhatsAppClick) {
      onWhatsAppClick();
    } else {
      window.open(`https://wa.me/${whatsappNum}?text=${encodeURIComponent(`Hello ${name}, I would like to inquire about booking a spa therapy.`)}`, '_blank');
    }
  };

  const activeLocations = (serviceAreas || []).filter(a => a.status === 'active').slice(0, 6);

  return (
    <footer className="w-full border-t border-gray-200 bg-white py-6 px-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Service Areas Navigation Links */}
        {activeLocations.length > 0 && (
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1.5 text-xs text-gray-500 pb-3 border-b border-gray-100">
            <span className="font-semibold text-gray-700">Target Service Areas:</span>
            {activeLocations.map((loc, idx) => (
              <span key={loc.id} className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/locations/${loc.slug}`)}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {loc.name}
                </button>
                {idx < activeLocations.length - 1 && <span className="text-gray-300">•</span>}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <p>&copy; 2026 {name}. All Rights Reserved.</p>
            <span className="hidden sm:inline text-gray-300">•</span>
            <button
              onClick={() => navigate('/about')}
              className="text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              About Us
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => navigate('/blog')}
              className="text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
            >
              Wellness Blog
            </button>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 text-gray-400">
            {/* Facebook */}
            {facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                </svg>
              </a>
            )}

            {/* Instagram */}
            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-pink-600 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}

            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              aria-label="WhatsApp"
              className="hover:text-green-600 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

