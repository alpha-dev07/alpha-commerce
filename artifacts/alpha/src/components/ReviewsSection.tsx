import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { StarPicker } from "./StarPicker";
import { ReviewCard } from "./ReviewCard";
import { addReview, updateReview } from "../lib/reviews";
import type { Review } from "../types/review";
import type { CartItem } from "../context/CartContext";
import { Star, MessageSquarePlus, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface ReviewsSectionProps {
  productId: string;
}

function AverageStars({ avg, count }: { avg: number; count: number }) {
  const full = Math.floor(avg);
  const hasHalf = avg - full >= 0.5;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-4xl font-black text-foreground">
        {count === 0 ? "—" : avg.toFixed(1)}
      </span>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`w-4 h-4 ${
              s <= full
                ? "fill-yellow-400 text-yellow-400"
                : s === full + 1 && hasHalf
                ? "fill-yellow-400/50 text-yellow-400"
                : "fill-muted text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {count === 0 ? "No reviews yet" : `${count} ${count === 1 ? "review" : "reviews"}`}
      </span>
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "1 – 2",
  2: "2 – 3",
  3: "3 – 4",
  4: "4 – 5",
  5: "5",
};

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-3 text-right">{star}</span>
      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
    </div>
  );
}

export function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // List state
  const [showAll, setShowAll] = useState(false);

  // Real-time reviews subscription
  useEffect(() => {
    const q = query(collection(db, "reviews"), where("productId", "==", productId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Review))
        .sort((a, b) => b.createdAt - a.createdAt);
      setReviews(data);
      setReviewsLoading(false);
    });
    return unsub;
  }, [productId]);

  // Check if user has purchased this product (one-time check)
  useEffect(() => {
    if (!user) {
      setPurchaseLoading(false);
      return;
    }
    getDocs(
      query(collection(db, "orders"), where("userId", "==", user.uid))
    ).then((snap) => {
      const purchased = snap.docs.some((d) =>
        ((d.data().items ?? []) as CartItem[]).some(
          (item) => item.product.id === productId
        )
      );
      setIsPurchased(purchased);
      setPurchaseLoading(false);
    });
  }, [user, productId]);

  const myReview = user ? reviews.find((r) => r.userId === user.uid) : undefined;
  const otherReviews = user ? reviews.filter((r) => r.userId !== user.uid) : reviews;
  const displayedOthers = showAll ? otherReviews : otherReviews.slice(0, 3);

  // Stats
  const count = reviews.length;
  const avg =
    count === 0
      ? 0
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10;
  const dist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  const openWriteForm = () => {
    setEditingReview(null);
    setRating(0);
    setTitle("");
    setBody("");
    setFormError(null);
    setShowForm(true);
  };

  const openEditForm = (r: Review) => {
    setEditingReview(r);
    setRating(r.rating);
    setTitle(r.title);
    setBody(r.body);
    setFormError(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingReview(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (rating === 0) { setFormError("Please select a star rating."); return; }
    if (body.trim().length < 10) { setFormError("Review must be at least 10 characters."); return; }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingReview) {
        await updateReview(editingReview.id, productId, {
          rating,
          title: title.trim(),
          body: body.trim(),
        });
      } else {
        const userName =
          user?.displayName ||
          user?.email?.split("@")[0] ||
          "Customer";
        await addReview({
          productId,
          userId: user!.uid,
          userName,
          rating,
          title: title.trim(),
          body: body.trim(),
        });
      }
      setShowForm(false);
      setEditingReview(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5" data-testid="reviews-section">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold">Ratings &amp; Reviews</h3>
        {count > 0 && (
          <span className="bg-yellow-400/10 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-400/20">
            {avg.toFixed(1)} ★
          </span>
        )}
      </div>

      {reviewsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary card */}
          {count > 0 && (
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
              <AverageStars avg={avg} count={count} />
              <div className="flex-1 flex flex-col gap-1.5">
                {dist.map(({ star, count: c }) => (
                  <RatingBar key={star} star={star} count={c} total={count} />
                ))}
              </div>
            </div>
          )}

          {/* Write review CTA / eligibility */}
          {!purchaseLoading && user && !showForm && (
            <>
              {isPurchased && !myReview && (
                <button
                  onClick={openWriteForm}
                  data-testid="btn-write-review"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-primary/40 bg-primary/5 text-primary font-semibold text-sm active:scale-[0.98] transition-transform"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Write a Review
                </button>
              )}
              {!isPurchased && count === 0 && (
                <div className="px-4 py-3 rounded-xl bg-card border border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Purchase this product to be the first to leave a review.
                  </p>
                </div>
              )}
              {!isPurchased && count > 0 && (
                <p className="text-[11px] text-muted-foreground text-center">
                  Only verified buyers can write reviews.
                </p>
              )}
            </>
          )}

          {/* Review form */}
          {showForm && (
            <div
              className="flex flex-col gap-4 p-4 rounded-2xl bg-card border border-border"
              data-testid="review-form"
            >
              <h4 className="text-sm font-bold">
                {editingReview ? "Edit your review" : "Write a review"}
              </h4>

              {/* Star picker */}
              <StarPicker value={rating} onChange={setRating} />

              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Title <span className="font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Summarise your experience"
                  maxLength={80}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-review-title"
                  className="w-full h-10 px-3 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              {/* Body */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Review <span className="text-destructive">*</span>
                </label>
                <textarea
                  placeholder="Share details about your experience with this product…"
                  maxLength={500}
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  data-testid="input-review-body"
                  className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
                <span className="text-[11px] text-muted-foreground text-right">
                  {body.length}/500
                </span>
              </div>

              {formError && (
                <p className="text-xs text-destructive font-medium" data-testid="review-form-error">
                  {formError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={cancelForm}
                  disabled={submitting}
                  className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold active:scale-[0.97] transition-transform disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  data-testid="btn-submit-review"
                  className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingReview ? (
                    "Update Review"
                  ) : (
                    "Post Review"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* My review (pinned at top) */}
          {myReview && !showForm && (
            <ReviewCard
              key={myReview.id}
              review={myReview}
              isOwn={true}
              onEdit={openEditForm}
              onDeleted={() => {}}
            />
          )}

          {/* Other reviews */}
          {otherReviews.length > 0 && (
            <div className="flex flex-col gap-3">
              {displayedOthers.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  isOwn={false}
                  onEdit={() => {}}
                  onDeleted={() => {}}
                />
              ))}

              {otherReviews.length > 3 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="flex items-center justify-center gap-1.5 w-full h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground active:bg-card transition-colors"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-4 h-4" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show {otherReviews.length - 3} more{" "}
                      {otherReviews.length - 3 === 1 ? "review" : "reviews"}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {count === 0 && !showForm && (
            <div className="flex flex-col items-center gap-2 py-6">
              <Star className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-sm text-muted-foreground">No reviews yet</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
