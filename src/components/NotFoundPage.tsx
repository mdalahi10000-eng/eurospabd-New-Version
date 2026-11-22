import { useEffect } from 'react';
import { Home } from 'lucide-react';
import { Service } from '../types';
import { Link } from './Link';
import { markPageNotFound } from '../config/seoConfig';

export function NotFoundPage({ services = [] }: { services?: Service[] }) {
  useEffect(() => {
    markPageNotFound();
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
      <p className="text-5xl font-extrabold text-slate-200 mb-2">404</p>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
        Sorry, this page does not exist. Explore our spa and massage treatments in Banani, Dhaka instead.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2"
      >
        <Home className="w-4 h-4" />
        <span>Go to Homepage</span>
      </Link>
      {services.length > 0 && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {services.slice(0, 8).map((s) => (
            <Link
              key={s.id}
              to={`/services/${s.slug || s.id}`}
              className="px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-700 hover:border-blue-300 hover:text-blue-700"
            >
              {s.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
