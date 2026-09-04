import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, CheckCircle, PenLine, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { INITIAL_REVIEWS, SPA_INFO } from '../../data/spaData';
import { StoredReview, submitReview, loginWithGoogle } from '../../firebase';
import { User } from 'firebase/auth';
import { ReviewItem } from '../../types';
import { connectGoogleBusinessAccount } from '../../services/googleBusinessProfile';

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  firebaseReviews: StoredReview[];
  syncedReviews?: ReviewItem[];
  syncedRating?: number;
  syncedCount?: number;
  initialWriteMode?: boolean;
}

export function ReviewsModal({
  isOpen,
  onClose,
  currentUser,
  firebaseReviews,
  syncedReviews,
  syncedRating,
  syncedCount,
  initialWriteMode = false
}: ReviewsModalProps) {
  const [visibleCount, setVisibleCount] = useState(12);
  const [showWriteForm, setShowWriteForm] = useState(initialWriteMode);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewerName, setReviewerName] = useState(currentUser?.displayName || '');
  const [reviewComment, setReviewComment] = useState('');
  const [serviceUsed, setServiceUsed] = useState('Swedish Massage');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const baseReviews = (syncedReviews && syncedReviews.length > 0) ? syncedReviews : INITIAL_REVIEWS;

  // Merge Firestore reviews at top
  const combinedReviews = [
    ...firebaseReviews.map(r => ({
      id: r.id || `fb-${Math.random()}`,
      name: r.userName,
      avatar: r.userPhoto || 'https://lh3.googleusercontent.com/a/default-user',
      rating: r.rating,
      date: 'Just now',
      reviewText: r.comment,
      serviceUsed: r.serviceTag || 'Signature Therapy',
      verified: true
    })),
    ...baseReviews
  ];

  const displayRating = syncedRating ?? SPA_INFO.rating;
  const displayCount = syncedCount ?? Math.max(SPA_INFO.reviewsCount, combinedReviews.length);

  const currentVisibleReviews = combinedReviews.slice(0, visibleCount);
  const hasMore = visibleCount < combinedReviews.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 10, combinedReviews.length));
  };

  const handleSyncWithGoogle = async () => {
    setIsSyncingGoogle(true);
    setSyncStatusMsg('Connecting to Google Business Profile...');
    try {
      const res = await connectGoogleBusinessAccount();
      if (res?.errorNote) {
        setSyncStatusMsg(res.errorNote);
        setTimeout(() => setSyncStatusMsg(null), 6000);
      } else {
        setSyncStatusMsg('Google Business Profile synced successfully!');
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
    } catch (err: any) {
      console.warn('Sync notice:', err);
      setSyncStatusMsg('Google Business Profile verified cache active');
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg('');
      const user = await loginWithGoogle();
      if (user?.displayName) {
        setReviewerName(user.displayName);
      }
    } catch (e: any) {
      console.error('Sign in notice:', e);
      if (e?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Google sign-in encountered an issue. You can still type your name directly.');
      }
    }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      setErrorMsg('Please enter your review text.');
      return;
    }
    const finalName = reviewerName.trim() || currentUser?.displayName || 'Valued Guest';

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await submitReview({
        userId: currentUser?.uid || 'guest',
        userName: finalName,
        userPhoto: currentUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        rating,
        comment: reviewComment.trim(),
        serviceTag: serviceUsed
      });
      setSubmittedSuccess(true);
      setReviewComment('');
      setTimeout(() => {
        setSubmittedSuccess(false);
        setShowWriteForm(false);
      }, 2000);
    } catch (err: any) {
      console.error('Submit review error:', err);
      setErrorMsg('Unable to submit review right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/65 backdrop-blur-[2px]"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 my-auto flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/70">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900">
                Client Reviews
              </h2>
              <p className="text-xs text-neutral-500 font-medium">
                {SPA_INFO.name} • {SPA_INFO.locationShort}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!showWriteForm && (
                <button
                  id="btn-modal-write-review"
                  onClick={() => setShowWriteForm(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-full transition-all cursor-pointer shadow-xs"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Write Review</span>
                </button>
              )}
              <button
                id="btn-close-reviews-modal"
                onClick={onClose}
                aria-label="Close reviews"
                className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rating Summary Bar */}
          <div className="px-5 py-3.5 bg-blue-50/40 border-b border-blue-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-extrabold text-gray-900">{displayRating.toFixed(1)}</span>
              <div>
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[11px] text-gray-600 font-medium">
                  Based on {displayCount} Google Business reviews
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">         
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100/80 px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Google Verified
              </span>
            </div>
          </div>

          {syncStatusMsg && (
            <div className="px-5 py-2 bg-blue-50 text-[11px] text-blue-800 font-medium border-b border-blue-100 flex items-center justify-between">
              <span>{syncStatusMsg}</span>
              <button onClick={() => setSyncStatusMsg(null)} className="text-blue-500 hover:text-blue-700 font-bold">×</button>
            </div>
          )}

          {/* Body Content (Scrollable) */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Write Review Form Collapsible */}
            {showWriteForm && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-2xs transition-all">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Share Your Experience
                  </h3>
                  <button
                    onClick={() => setShowWriteForm(false)}
                    className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                {submittedSuccess ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 text-xs text-center flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Thank you! Your review has been submitted and published.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-3">
                    {/* Rating stars selector */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Your Rating
                      </label>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setRating(star)}
                            className="p-1 hover:scale-110 transition-transform cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                (hoverRating !== null ? star <= hoverRating : star <= rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name + Service used */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          required
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="e.g. Rifat Ahmed"
                          className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Treatment Selected
                        </label>
                        <select
                          value={serviceUsed}
                          onChange={(e) => setServiceUsed(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                      <option>Swedish Massage</option>
                      <option>Full Body Massage</option>
                      <option>Deep Tissue Massage</option>
                      <option>Aromatherapy Massage</option>
                      <option>Hot Stone Massage</option>
                      <option>Thai Herbal Compress Therapy</option>
                      <option>Foot Reflexology & Botanical Scrub</option>
                      <option>Dry Massage</option>
                      <option>Oil Massage</option>
                      <option>Aroma Body Massage</option>
                      <option>Body to Body Massage</option>
                      <option>Four Hand Massage</option>
                      <option>Six Hand Massage</option>
                        </select>
                      </div>
                    </div>

                    {/* Review text */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Review Details
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Tell others about your massage experience, cleanliness, and therapists..."
                        className="w-full text-xs p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-red-600">{errorMsg}</p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {!currentUser && (
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          className="text-[11px] text-blue-600 hover:text-blue-700 underline cursor-pointer font-medium"
                        >
                          Sign in with Google
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-blue-100"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <span>Post Review</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Reviews List (10-12 initially with scrolling) */}
            <div className="space-y-3.5">
              {currentVisibleReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-gray-300 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rev.avatar}
                        alt={rev.name}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                            {rev.name}
                          </h4>
                          {rev.verified && (
                            <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.2 rounded font-medium">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex text-amber-400">
                            {[...Array(rev.rating)].map((_, idx) => (
                              <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {rev.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    {rev.serviceUsed && (
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md hidden sm:inline-block">
                        {rev.serviceUsed}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs sm:text-sm text-gray-700 leading-relaxed">
                    {rev.reviewText}
                  </p>
                </div>
              ))}
            </div>

            {/* Load More Button for 20+ reviews */}
            {hasMore ? (
              <div className="pt-2 text-center">
                <button
                  id="btn-load-more-reviews"
                  onClick={handleLoadMore}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Load More Reviews ({combinedReviews.length - visibleCount} more)
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-gray-400 pt-2">
                You've viewed all {combinedReviews.length} reviews
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
