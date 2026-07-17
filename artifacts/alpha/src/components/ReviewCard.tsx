import { useState } from "react";
import { Star, Pencil, Trash2, Loader2, ShieldCheck } from "lucide-react";
import type { Review } from "../types/review";
import { deleteReview } from "../lib/reviews";

interface ReviewCardProps {
  review: Review;
  isOwn: boolean;
  onEdit: (review: Review) => void;
  onDeleted: () => void;
}

function StaticStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function formatReviewDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ReviewCard({ review, isOwn, onEdit, onDeleted }: ReviewCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteReview(review.id, review.productId);
      onDeleted();
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 p-4 rounded-2xl border ${
        isOwn ? "bg-primary/5 border-primary/20" : "bg-card border-border"
      }`}
      data-testid={`review-card-${review.id}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {review.userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold leading-none">
                  {isOwn ? "You" : review.userName}
                </span>
                {isOwn && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    Your review
                  </span>
                )}
              </div>
              <span className="text-[11px] text-muted-foreground mt-0.5">
                {formatReviewDate(review.createdAt)}
                {review.updatedAt !== review.createdAt && " · edited"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-10">
            <StaticStars rating={review.rating} />
            <span className="flex items-center gap-0.5 text-[10px] text-primary font-semibold">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          </div>
        </div>

        {/* Own review actions */}
        {isOwn && !confirmDelete && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(review)}
              data-testid="btn-edit-review"
              className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center active:scale-90 transition-transform"
            >
              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              data-testid="btn-delete-review"
              className="w-8 h-8 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      {review.title && (
        <p className="text-sm font-bold leading-snug">{review.title}</p>
      )}

      {/* Body */}
      <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="flex flex-col gap-2 pt-1 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Delete this review?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="flex-1 h-8 rounded-lg border border-border text-xs font-semibold active:scale-[0.97] transition-transform disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              data-testid="btn-confirm-delete-review"
              className="flex-1 h-8 rounded-lg bg-destructive text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
