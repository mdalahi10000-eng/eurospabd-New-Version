import { useState, useEffect, useMemo, FormEvent } from 'react';
import { User } from 'firebase/auth';
import { 
  MessageSquareQuote, 
  Star, 
  Eye, 
  EyeOff, 
  Trash2, 
  Reply, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  Send,
  X,
  Plus,
  Pencil,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  AdminReview, 
  ReviewStatus, 
  subscribeToAdminReviews, 
  updateReviewStatus, 
  updateReview,
  createAdminReview,
  saveAdminResponse, 
  deleteReview,
  seedInitialReviewsIfEmpty
} from '../../../services/reviewsService';

interface AdminReviewsSectionProps {
  currentUser: User | null;
}

export function AdminReviewsSection({ currentUser }: AdminReviewsSectionProps) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Edit / Create Modal State
  const [editingReview, setEditingReview] = useState<AdminReview | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editForm, setEditForm] = useState({
    userName: '',
    userPhoto: '',
    rating: 5,
    comment: '',
    serviceTag: 'Swedish Massage',
    status: 'approved' as ReviewStatus,
    adminResponse: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAdminReviews((data) => {
      setReviews(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showNotification = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleManualSync = async () => {
    setIsSeeding(true);
    try {
      const seeded = await seedInitialReviewsIfEmpty();
      if (seeded.length > 0) {
        setReviews(seeded);
        showNotification(`Successfully loaded ${seeded.length} reviews from Firestore`);
      } else {
        showNotification('Reviews are already up to date in Firestore');
      }
    } catch (err) {
      console.error('Manual seed error:', err);
      showNotification('Error syncing reviews');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleToggleStatus = async (review: AdminReview) => {
    const nextStatus: ReviewStatus = review.status === 'hidden' ? 'approved' : 'hidden';
    try {
      await updateReviewStatus(review.id, nextStatus);
      showNotification(nextStatus === 'approved' ? 'Review published to public site' : 'Review hidden from public site');
    } catch (err) {
      console.error('Failed to toggle review status:', err);
      alert('Failed to change review visibility.');
    }
  };

  const handleOpenReply = (review: AdminReview) => {
    setReplyingToId(review.id);
    setReplyText(review.adminResponse || '');
  };

  const handleSaveReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setIsSavingReply(true);
    try {
      await saveAdminResponse(reviewId, replyText.trim());
      showNotification('Official response saved and displayed on website');
      setReplyingToId(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to save admin response:', err);
      alert('Failed to save response.');
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleDelete = async (review: AdminReview) => {
    if (!window.confirm(`Are you sure you want to permanently delete the review from "${review.userName}"?`)) {
      return;
    }
    try {
      await deleteReview(review.id);
      showNotification('Review deleted successfully');
    } catch (err) {
      console.error('Delete review error:', err);
      alert('Failed to delete review.');
    }
  };

  const handleOpenEdit = (review: AdminReview) => {
    setEditingReview(review);
    setIsCreatingNew(false);
    setEditForm({
      userName: review.userName || '',
      userPhoto: review.userPhoto || '',
      rating: review.rating || 5,
      comment: review.comment || '',
      serviceTag: review.serviceTag || 'Swedish Massage',
      status: review.status || 'approved',
      adminResponse: review.adminResponse || ''
    });
  };

  const handleOpenCreate = () => {
    setEditingReview(null);
    setIsCreatingNew(true);
    setEditForm({
      userName: '',
      userPhoto: '',
      rating: 5,
      comment: '',
      serviceTag: 'Swedish Massage',
      status: 'approved',
      adminResponse: ''
    });
  };

  const handleSaveEditForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!editForm.userName.trim() || !editForm.comment.trim()) {
      alert('Please provide client name and comment.');
      return;
    }

    setIsSavingEdit(true);
    try {
      if (isCreatingNew) {
        await createAdminReview({
          userName: editForm.userName.trim(),
          userPhoto: editForm.userPhoto.trim() || 'https://lh3.googleusercontent.com/a/default-user',
          rating: Number(editForm.rating),
          comment: editForm.comment.trim(),
          serviceTag: editForm.serviceTag.trim(),
          status: editForm.status,
          adminResponse: editForm.adminResponse.trim(),
          verified: true
        });
        showNotification('New review added successfully');
      } else if (editingReview) {
        await updateReview(editingReview.id, {
          userName: editForm.userName.trim(),
          userPhoto: editForm.userPhoto.trim() || editingReview.userPhoto,
          rating: Number(editForm.rating),
          comment: editForm.comment.trim(),
          serviceTag: editForm.serviceTag.trim(),
          status: editForm.status,
          adminResponse: editForm.adminResponse.trim()
        });
        showNotification('Review updated successfully');
      }
      setEditingReview(null);
      setIsCreatingNew(false);
    } catch (err) {
      console.error('Error saving review:', err);
      alert('Failed to save review changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Metrics
  const stats = useMemo(() => {
    const total = reviews.length;
    let approved = 0;
    let hidden = 0;
    let sumRating = 0;
    const ratingDist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    reviews.forEach(r => {
      if (r.status === 'hidden') hidden++;
      else approved++;

      const rate = Math.round(r.rating || 5);
      sumRating += r.rating || 5;
      if (ratingDist[rate] !== undefined) ratingDist[rate]++;
    });

    const avg = total > 0 ? (sumRating / total).toFixed(1) : '5.0';
    return { total, approved, hidden, avg, ratingDist };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = r.userName.toLowerCase().includes(q);
        const matchesComment = r.comment.toLowerCase().includes(q);
        const matchesService = (r.serviceTag || '').toLowerCase().includes(q);
        if (!matchesName && !matchesComment && !matchesService) return false;
      }

      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      if (ratingFilter !== 'all' && Math.round(r.rating).toString() !== ratingFilter) {
        return false;
      }

      return true;
    });
  }, [reviews, searchQuery, statusFilter, ratingFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {actionFeedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Testimonials & Reviews Moderation
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              ★ {stats.avg} Average
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage verified client reviews, edit text & ratings, toggle visibility, post official replies, or add new testimonials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={isSeeding}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Reload from Firestore / Seed reviews if missing"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>Sync Firestore</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Testimonial</span>
          </button>
        </div>
      </div>

      {/* Summary Scoreboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Reviews</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Synced in Firestore</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Average Rating</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-1.5">
            <span>{stats.avg}</span>
            <div className="flex text-amber-400">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Out of 5.0 Stars</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Approved (Visible)</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.approved}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Displayed on Website</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Hidden / Moderated</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.hidden}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Filtered from public view</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews by client name, comment text, or treatment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Visibility</option>
            <option value="approved">Approved Only</option>
            <option value="hidden">Hidden Only</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Stars</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Content List */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading reviews from Firestore...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <MessageSquareQuote className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No reviews found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'all' || ratingFilter !== 'all'
              ? 'Try clearing or changing your search filters.'
              : 'Click "Sync Firestore" above or add a testimonial.'}
          </p>
          <button
            onClick={handleManualSync}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Default Reviews into Firestore</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const isReplying = replyingToId === rev.id;

            return (
              <div
                key={rev.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Header: User & Rating & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.userPhoto || 'https://lh3.googleusercontent.com/a/default-user'}
                      alt={rev.userName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">
                          {rev.userName}
                        </h4>
                        {rev.status === 'hidden' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Hidden
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Approved
                          </span>
                        )}
                        {rev.dateString && (
                          <span className="text-[10px] text-slate-400">
                            {rev.dateString}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex text-amber-400">
                          {[...Array(Math.round(rev.rating || 5))].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        {rev.serviceTag && (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {rev.serviceTag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(rev)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                      title="Edit review text, rating, or client info"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Edit</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(rev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                        rev.status === 'hidden'
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                      title={rev.status === 'hidden' ? 'Approve & Show on site' : 'Hide from site'}
                    >
                      {rev.status === 'hidden' ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hide</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenReply(rev)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      title="Reply as Euro Spa Center"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>{rev.adminResponse ? 'Edit Reply' : 'Reply'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(rev)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete review permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-13">
                  "{rev.comment}"
                </p>

                {/* Admin Official Response Display */}
                {rev.adminResponse && !isReplying && (
                  <div className="ml-13 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Official Response from Euro Spa Center</span>
                      </div>
                      <button
                        onClick={() => handleOpenReply(rev)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {rev.adminResponse}
                    </p>
                  </div>
                )}

                {/* Inline Reply Editor */}
                {isReplying && (
                  <div className="ml-13 p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <Reply className="w-3.5 h-3.5 text-blue-600" />
                        Reply to {rev.userName} as Euro Spa Center
                      </span>
                      <button
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyText('');
                        }}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="e.g. Thank you for your review! We look forward to welcoming you back to Euro Spa Center soon..."
                      className="w-full text-xs p-3 bg-white border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingToId(null);
                          setReplyText('');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isSavingReply || !replyText.trim()}
                        onClick={() => handleSaveReply(rev.id)}
                        className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSavingReply ? 'Saving...' : 'Post Response'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Review Modal */}
      {(editingReview || isCreatingNew) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isCreatingNew ? 'Add Client Testimonial' : 'Edit Review'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isCreatingNew ? 'Create a verified testimonial in Firestore' : `Editing feedback for ${editingReview?.userName}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingReview(null);
                  setIsCreatingNew(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.userName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, userName: e.target.value }))}
                    placeholder="e.g. Tanvir Ahmed"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Treatment / Service Tag
                  </label>
                  <input
                    type="text"
                    value={editForm.serviceTag}
                    onChange={(e) => setEditForm(prev => ({ ...prev, serviceTag: e.target.value }))}
                    placeholder="e.g. Deep Tissue Therapy"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Star Rating (1 - 5)
                  </label>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, rating: s }))}
                        className="cursor-pointer p-0.5"
                      >
                        <Star className={`w-5 h-5 ${s <= editForm.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {editForm.rating}.0
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Visibility Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as ReviewStatus }))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="approved">Approved (Visible Live)</option>
                    <option value="hidden">Hidden (Moderated)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Avatar / Photo URL (Optional)
                </label>
                <input
                  type="url"
                  value={editForm.userPhoto}
                  onChange={(e) => setEditForm(prev => ({ ...prev, userPhoto: e.target.value }))}
                  placeholder="https://..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Review Comment *
                </label>
                <textarea
                  rows={4}
                  required
                  value={editForm.comment}
                  onChange={(e) => setEditForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Enter client review feedback..."
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Official Euro Spa Center Response (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editForm.adminResponse}
                  onChange={(e) => setEditForm(prev => ({ ...prev, adminResponse: e.target.value }))}
                  placeholder="Response displayed directly underneath this review..."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReview(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : isCreatingNew ? 'Publish Review' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
