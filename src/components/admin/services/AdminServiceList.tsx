import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Edit3, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Clock, 
  DollarSign, 
  Tag, 
  AlertTriangle,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { Service } from '../../../types';

interface AdminServiceListProps {
  services: Service[];
  loading: boolean;
  onNewService: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (serviceId: string) => Promise<void>;
  onDuplicateService: (service: Service) => Promise<void>;
  onToggleStatus: (service: Service) => Promise<void>;
  onReorder: (reorderedServices: Service[]) => Promise<void>;
}

export function AdminServiceList({
  services,
  loading,
  onNewService,
  onEditService,
  onDeleteService,
  onDuplicateService,
  onToggleStatus,
  onReorder
}: AdminServiceListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const categories = ['All', ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))];

  const totalCount = services.length;
  const activeCount = services.filter(s => s.status !== 'inactive').length;
  const inactiveCount = services.filter(s => s.status === 'inactive').length;

  const filteredServices = services.filter(svc => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      svc.name.toLowerCase().includes(term) ||
      (svc.slug && svc.slug.toLowerCase().includes(term)) ||
      (svc.category && svc.category.toLowerCase().includes(term)) ||
      (svc.focusKeyword && svc.focusKeyword.toLowerCase().includes(term)) ||
      svc.shortDescription.toLowerCase().includes(term);

    const isCurrentActive = svc.status !== 'inactive';
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && isCurrentActive) ||
      (statusFilter === 'inactive' && !isCurrentActive);

    const matchesCategory = categoryFilter === 'All' || svc.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    try {
      setActionInProgress(serviceToDelete.id);
      await onDeleteService(serviceToDelete.id);
      setServiceToDelete(null);
    } catch (err) {
      console.error('Failed to delete service:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDuplicate = async (service: Service) => {
    try {
      setActionInProgress(service.id);
      await onDuplicateService(service);
    } catch (err) {
      console.error('Failed to duplicate service:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggle = async (service: Service) => {
    try {
      setActionInProgress(service.id);
      await onToggleStatus(service);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= services.length) return;

    const copy = [...services];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Update displayOrder
    copy.forEach((s, idx) => {
      s.displayOrder = idx;
    });

    await onReorder(copy);
  };

  // Helper to compute quick SEO score for list view
  const getSeoHealth = (s: Service) => {
    let score = 0;
    if (s.seoTitle || s.name) score += 20;
    if (s.metaDescription || s.shortDescription) score += 20;
    if (s.focusKeyword) score += 20;
    if (s.imageAlt) score += 20;
    if (s.serviceAreas && s.serviceAreas.length > 0) score += 20;

    if (score >= 80) return { label: 'Optimal', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-50 text-blue-800 border-blue-200' };
    return { label: 'Needs SEO', color: 'bg-amber-50 text-amber-800 border-amber-200' };
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-blue-600" />
            <span>Services & Pricing Management CMS</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage treatments, durations, pricing tiers, and local SEO ranking metadata. Updates immediately sync to public site.
          </p>
        </div>

        <button
          onClick={onNewService}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All Services</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200/60 text-slate-500'
              }`}>
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Active (Live)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                {activeCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'inactive'
                  ? 'bg-slate-200 text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Inactive</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-300 text-slate-800">
                {inactiveCount}
              </span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search services, keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {categories.length > 1 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Services Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3 text-slate-400 shadow-2xs">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading services from database...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-2xs space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">
              {services.length === 0 ? 'No Services in Database' : 'No Matching Services Found'}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
              {services.length === 0 
                ? 'Create a service treatment to display on your public website.' 
                : 'Try adjusting your search terms or filters.'}
            </p>
          </div>
          {services.length === 0 ? (
            <button
              onClick={onNewService}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Service</span>
            </button>
          ) : (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('All'); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-3 sm:px-4 text-center w-12">Order</th>
                  <th className="py-3.5 px-4 sm:px-6">Service Details</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Pricing & Duration</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">SEO Health</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredServices.map((service, index) => {
                  const isBusy = actionInProgress === service.id;
                  const isActive = service.status !== 'inactive';
                  const seoHealth = getSeoHealth(service);
                  const primaryPrice = service.price || service.priceOptions?.[0]?.price || 'BDT 3,500';

                  return (
                    <tr 
                      key={service.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Order Up/Down buttons */}
                      <td className="py-3.5 px-3 sm:px-4 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMove(index, 'up')}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move up in order"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            {service.displayOrder ?? index}
                          </span>
                          <button
                            type="button"
                            disabled={index === filteredServices.length - 1}
                            onClick={() => handleMove(index, 'down')}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="Move down in order"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Name, Slug, Thumbnail */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                            <img
                              src={service.image}
                              alt={service.imageAlt || service.name}
                              className="w-full h-full object-cover"
                            />
                            {service.popular && (
                              <span className="absolute top-1 left-1 bg-blue-600 text-white text-[8px] font-bold px-1 rounded shadow-xs">
                                Pop
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span 
                                onClick={() => onEditService(service)}
                                className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer truncate max-w-[220px] sm:max-w-[300px]"
                              >
                                {service.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                              <span>/services/{service.slug || service.id}</span>
                              {service.category && (
                                <>
                                  <span>•</span>
                                  <span className="font-sans text-slate-400">{service.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pricing & Duration */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">
                            {primaryPrice}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{service.durationRange}</span>
                            {service.priceOptions && service.priceOptions.length > 1 && (
                              <span className="text-[10px] text-blue-600 bg-blue-50 px-1 rounded">
                                +{service.priceOptions.length - 1} tiers
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>

                      {/* SEO Health */}
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${seoHealth.color}`}>
                            <span>{seoHealth.label}</span>
                          </span>
                          {service.focusKeyword && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              "{service.focusKeyword}"
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Inactive */}
                          <button
                            disabled={isBusy}
                            onClick={() => handleToggle(service)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                            title={isActive ? 'Deactivate service' : 'Activate service on public site'}
                          >
                            {isActive ? 'Pause' : 'Activate'}
                          </button>

                          {/* Duplicate */}
                          <button
                            disabled={isBusy}
                            onClick={() => handleDuplicate(service)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Duplicate Service"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditService(service)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Service & SEO"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            disabled={isBusy}
                            onClick={() => setServiceToDelete(service)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {serviceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Delete Service?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800">"{serviceToDelete.name}"</strong>? This will permanently remove the service from Firestore and it will immediately be removed from the public website and booking options.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(actionInProgress)}
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {actionInProgress ? 'Deleting...' : 'Yes, Delete Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
