import { ChevronRight, Star, PenLine } from 'lucide-react';
import { INITIAL_REVIEWS } from '../data/spaData';
import { StoredReview } from '../firebase';
import { ReviewItem } from '../types';

interface ReviewsSectionProps {
  onOpenReviewsModal: () => void;
  onWriteReviewClick: () => void;
  firebaseReviews?: StoredReview[];
  syncedReviews?: ReviewItem[];
}

export function ReviewsSection({ 
  onOpenReviewsModal, 
  onWriteReviewClick,
  firebaseReviews = [],
  syncedReviews
}: ReviewsSectionProps) {
  const baseReviews = (syncedReviews && syncedReviews.length > 0) ? syncedReviews : INITIAL_REVIEWS;

  // Filter approved Firestore reviews
  const approvedFirebase = firebaseReviews
    .filter(r => (r as any).status !== 'hidden')
    .map(r => ({
      id: r.id || 'fb-1',
      name: r.userName,
      avatar: r.userPhoto || 'https://lh3.googleusercontent.com/a/default-user',
      rating: r.rating || 5,
      reviewText: r.comment,
      adminResponse: (r as any).adminResponse
    }));

  const allFirebaseIds = new Set(firebaseReviews.map(r => r.id));
  const remainingBase = baseReviews.filter(b => !allFirebaseIds.has(b.id));

  const liveReviews = [...approvedFirebase, ...remainingBase];
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
    </section>
  );
}

