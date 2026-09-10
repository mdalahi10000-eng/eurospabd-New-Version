import { useState, useEffect, useMemo, FormEvent } from 'react';
import { User } from '../../../supabase';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  CheckCircle2, 
  X, 
  RefreshCw,
  FolderPlus,
  ArrowUpDown,
  BookOpen
} from 'lucide-react';
import { 
  fetchAllFAQs, 
  createFAQ, 
  updateFAQ, 
  deleteFAQ, 
  toggleFAQStatus, 
  reorderFAQs, 
  seedInitialFAQsIfEmpty 
} from '../../../services/faqService';
import { FAQItem } from '../../../types';

interface AdminFaqSectionProps {
  currentUser: User | null;
}

const CATEGORIES = [
  'All Categories',
  'General',
  'Bookings',
  'Services',
  'Hygiene & Safety',
  'Facilities',
  'Pricing & Payment',
  'Location & Arrival'
];

export function AdminFaqSection({ currentUser }: AdminFaqSectionProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'General',
    status: 'active' as 'active' | 'inactive'
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  useEffect(() => {
    loadFaqs();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadFaqs = async () => {
    setLoading(true);
    try {
      const items = await fetchAllFAQs();
      setFaqs(items);
    } catch (err) {
      console.warn('Error loading FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      const seeded = await seedInitialFAQsIfEmpty();
      if (seeded) {
        showToast('Initial FAQs successfully seeded into Supabase!');
      } else {
        showToast('FAQs already exist in database.');
      }
      await loadFaqs();
    } catch (err) {
      console.error('Error seeding FAQs:', err);
      alert('Failed to seed FAQs.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      question: '',
      answer: '',
      category: 'General',
      status: 'active'
    });
    setEditingFaq(null);
    setIsCreatingNew(true);
  };

  const handleOpenEditModal = (item: FAQItem) => {
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category || 'General',
      status: item.status
    });
    setEditingFaq(item);
    setIsCreatingNew(false);
  };

  const handleCloseModal = () => {
    setEditingFaq(null);
    setIsCreatingNew(false);
  };

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim() || !formData.answer.trim()) return;

    setIsSubmitting(true);
    try {
      if (isCreatingNew) {
        await createFAQ({
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          category: formData.category,
          displayOrder: faqs.length + 1,
          status: formData.status
        });
        showToast('New FAQ created successfully!');
      } else if (editingFaq) {
        await updateFAQ(editingFaq.id, {
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          category: formData.category,
          status: formData.status
        });
        showToast('FAQ updated successfully!');
      }
      handleCloseModal();
      await loadFaqs();
    } catch (err) {
      console.error('Error saving FAQ:', err);
      alert('Failed to save FAQ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: FAQItem) => {
    try {
      await toggleFAQStatus(item.id, item.status);
      setFaqs(prev => prev.map(f => f.id === item.id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f));
      showToast(`FAQ marked as ${item.status === 'active' ? 'Hidden' : 'Visible live'}!`);
    } catch (err) {
      console.error('Error toggling FAQ status:', err);
      alert('Failed to update FAQ status.');
    }
  };

  const handleDeleteFaq = async (item: FAQItem) => {
    if (!window.confirm(`Are you sure you want to delete this FAQ: "${item.question}"?`)) {
      return;
    }

    try {
      await deleteFAQ(item.id);
      setFaqs(prev => prev.filter(f => f.id !== item.id));
      showToast('FAQ deleted.');
    } catch (err) {
      console.error('Error deleting FAQ:', err);
      alert('Failed to delete FAQ.');
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const list = [...faqs];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Recalculate displayOrder
    const updated = list.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1
    }));

    setFaqs(updated);

    try {
      await reorderFAQs(updated.map(u => ({ id: u.id, displayOrder: u.displayOrder })));
      showToast('FAQ ordering updated!');
    } catch (err) {
      console.error('Error reordering FAQs:', err);
    }
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter(f => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ = f.question.toLowerCase().includes(q);
        const matchesA = f.answer.toLowerCase().includes(q);
        if (!matchesQ && !matchesA) return false;
      }

      if (categoryFilter !== 'All Categories' && f.category !== categoryFilter) {
        return false;
      }

      if (statusFilter !== 'all' && f.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [faqs, searchQuery, categoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = faqs.length;
    const active = faqs.filter(f => f.status === 'active').length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [faqs]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              FAQ Management CMS
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Live Supabase Sync
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Add, edit, delete, reorder, and toggle visibility for frequently asked client questions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {faqs.length === 0 && (
            <button
              type="button"
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>Seed Initial FAQs</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-100 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New FAQ</span>
          </button>
        </div>
      </div>

      {/* Stats Scoreboard */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Questions</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Active (Visible Live)</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Hidden / Draft</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.inactive}</div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Hidden Only</option>
          </select>
        </div>
      </div>

      {/* FAQ Items List */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading FAQs from Supabase...</p>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No FAQ items found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || categoryFilter !== 'All Categories' || statusFilter !== 'all'
              ? 'Try clearing or changing your filters.'
              : 'Add your first question and answer to help clients learn about your services and policies.'}
          </p>
          {faqs.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="mt-2 px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Seed Standard Spa FAQs
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq, index) => (
            <div
              key={faq.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 pt-0.5">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(index, 'up')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Question Up"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === filteredFaqs.length - 1}
                      onClick={() => handleMoveOrder(index, 'down')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                      title="Move Question Down"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Order Number & Badges */}
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                        {faq.displayOrder || index + 1}
                      </span>
                      {faq.category && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                          {faq.category}
                        </span>
                      )}
                      {faq.status === 'active' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Visible Live
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 pt-1">
                      {faq.question}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {faq.answer}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(faq)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1 ${
                      faq.status === 'active'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                    title={faq.status === 'active' ? 'Hide from public site' : 'Show on public site'}
                  >
                    {faq.status === 'active' ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Show</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(faq)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    title="Edit FAQ"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteFaq(faq)}
                    className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete FAQ permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreatingNew || editingFaq) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {isCreatingNew ? 'Add New FAQ Question' : 'Edit FAQ Item'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  required
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="e.g. Do I need to book in advance?"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORIES.filter(c => c !== 'All Categories').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Visibility Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active (Visible on public site)</option>
                    <option value="inactive">Hidden (Draft / Unpublished)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Answer *
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.answer}
                  onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                  placeholder="Provide a clear, accurate, and welcoming response..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : isCreatingNew ? 'Create FAQ' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
