import { ChevronRight, Star, PenLine } from 'lucide-react';
import { INITIAL_REVIEWS } from '../data/spaData';
import { StoredReview } from '../supabase';
import { ReviewItem } from '../types';

interface ReviewsSectionProps {
  onOpenReviewsModal: () => void;
  onWriteReviewClick: () => void;
  communityReviews?: StoredReview[];
  syncedReviews?: ReviewItem[];
  loading?: boolean;
}

export function ReviewsSection({ 
  onOpenReviewsModal, 
  onWriteReviewClick,
  communityReviews = [],
  syncedReviews,
  loading = false
}: ReviewsSectionProps) {
  const activeReviews = communityReviews;
  const baseReviews = (syncedReviews && syncedReviews.length > 0) ? syncedReviews : INITIAL_REVIEWS;

  // Filter approved Supabase reviews
  const approvedLive = activeReviews
    .filter(r => (r as any).status !== 'hidden')
    .map(r => ({
      id: r.id || 'rev-1',
      name: r.userName,
      avatar: r.userPhoto || 'https://lh3.googleusercontent.com/a/default-user',
      rating: r.rating || 5,
      reviewText: r.comment,
      adminResponse: (r as any).adminResponse
    }));

  const allLiveIds = new Set(activeReviews.map(r => r.id));
  const remainingBase = baseReviews.filter(b => !allLiveIds.has(b.id));

  // If reviews are loaded/cached, prioritize approved live reviews followed by base reviews
  const liveReviews = approvedLive.length > 0 
    ? [...approvedLive, ...remainingBase] 
    : baseReviews;
  const topReviews = liveReviews.slice(0, 3);

  return (
    <section id="section-reviews" className="px-4 py-5 border-b border-gray-100 bg-white">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">
          What Our Clients Say
        </h2>
        <div className="flex items-center gap-3">
          <button
            id="btn-write-review-top"
            onClick={onWriteReviewClick}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 cursor-pointer transition-colors"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Write a Review</span>
          </button>

          <button
            id="btn-view-all-reviews"
            onClick={onOpenReviewsModal}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Review Cards matching Clean Minimalism */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs animate-pulse space-y-3"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                  <div className="h-2.5 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-4/5" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : topReviews.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400">
          No reviews available at this time.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {topReviews.map((review) => (
          <div
            key={review.id}
            id={`review-card-${review.id}`}
            onClick={onOpenReviewsModal}
            className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Reviewer Header */}
              <div className="flex items-center gap-2.5">
                <img
                  src={review.avatar}
                  alt={review.name}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-snug">
                    {review.name}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{(review.rating ?? 5).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Review Comment */}
              <p className="mt-3 text-xs sm:text-sm text-gray-600 leading-relaxed line-clamp-3">
                {review.reviewText}
              </p>

              {review.adminResponse && (
                <div className="mt-2.5 p-2 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 leading-snug">
                  <span className="font-bold text-blue-700 block">Euro Spa Center:</span>
                  <span className="line-clamp-2 text-slate-700">{review.adminResponse}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </section>
  );
}

