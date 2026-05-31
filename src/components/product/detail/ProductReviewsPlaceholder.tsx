import { useRef, useState, useMemo } from 'react';
import axios from 'axios';
import {
  CheckCircle2,
  ImageIcon,
  Loader2,
  MessageCircle,
  Send,
  Star,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { cn } from '../../../lib/cn';
import { useAuth } from '../../../app/auth/AuthProvider';
import { useProductComments, useCreateComment, useDeleteComment } from '../../../hooks/useProductComments';
import { useQuery, useQueries } from '@tanstack/react-query';
import { orderService } from '../../../api/services';

// ─── Fractional stars ────────────────────────────────────────────────────────
function FractionalStars({ value, size = 20 }: { value: number; size?: number }) {
  const v = Math.min(5, Math.max(0, value));
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, v - i));
        return (
          <div key={i} className="relative shrink-0" style={{ width: size, height: size }}>
            <Star size={size} className="absolute text-border" strokeWidth={2} fill="none" />
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${fill * 100}%` }}
            >
              <Star size={size} className="fill-warning text-warning" strokeWidth={0} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Avatar initials ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-warning/15 text-warning',
  'bg-success/15 text-success',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
];
function avatarColor(userId: number) {
  return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}
function initials(fullName: string | null, username: string | null): string {
  const name = fullName ?? username ?? '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Date formatter ───────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Error message extractor ──────────────────────────────────────────────────
function extractError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { message?: string } | undefined;
    if (typeof body?.message === 'string' && body.message.trim()) return body.message.trim();
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterId = 'newest' | 'oldest';

type ProductReviewsPlaceholderProps = {
  productId?: number | null;
  id?: string;
  className?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductReviewsPlaceholder({ productId, id, className }: ProductReviewsPlaceholderProps) {
  const { t } = useI18n();
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<FilterId>('newest');
  const [commentText, setCommentText] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pid = productId ?? null;

  const {
    comments,
    commentsLoading,
    commentsError,
    avgRating,
    totalRatings,
    ratings,
  } = useProductComments(pid);

  const createMutation = useCreateComment(pid ?? 0);
  const deleteMutation = useDeleteComment(pid ?? 0);

  const { data: userOrders = [] } = useQuery({
    queryKey: ['user-orders-check-completed'],
    queryFn: () => orderService.listOrders(4), // 4 is COMPLETED
    enabled: isAuthenticated && pid !== null,
    staleTime: 5 * 60 * 1000,
  });

  const ordersNeedingDetails = useMemo(() => {
    return userOrders.filter((o) => !o.orderDetails || o.orderDetails.length === 0);
  }, [userOrders]);

  const enrichQueries = useQueries({
    queries: ordersNeedingDetails.map((o) => ({
      queryKey: ['order-detail-check-purchase', o.id],
      queryFn: () => orderService.getOrderById(o.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const hasPurchased = useMemo(() => {
    if (!isAuthenticated || !pid) return false;

    // Check if any order already has details and contains the product
    const foundInPopulated = userOrders.some((o) =>
      o.orderDetails?.some((line) => line.productId === pid)
    );
    if (foundInPopulated) return true;

    // Check in the enriched queries
    const foundInEnriched = enrichQueries.some((q) =>
      q.data?.orderDetails?.some((line) => line.productId === pid)
    );
    return foundInEnriched;
  }, [userOrders, enrichQueries, pid, isAuthenticated]);

  // ── Rating distribution (computed from ratings array) ─────────────────────
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    stars: star,
    count: ratings.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxBar = Math.max(...distribution.map((d) => d.count), 1);

  // ── Filtered & sorted comments ────────────────────────────────────────────
  const sortedComments = [...comments].sort((a, b) => {
    const ta = new Date(a.createdDate).getTime();
    const tb = new Date(b.createdDate).getTime();
    return filter === 'newest' ? tb - ta : ta - tb;
  });

  // ── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!pid || !commentText.trim()) return;
    setSubmitError(null);
    try {
      await createMutation.mutateAsync(commentText.trim());
      setCommentText('');
    } catch (err) {
      setSubmitError(extractError(err, 'Không thể gửi bình luận. Vui lòng thử lại.'));
    }
  };

  // ── Delete handler ────────────────────────────────────────────────────────
  const handleDelete = async (commentId: number) => {
    try {
      await deleteMutation.mutateAsync(commentId);
    } catch {
      // silent — comment stays in list on failure
    }
  };

  const filters: { id: FilterId; label: string }[] = [
    { id: 'newest', label: t('pdp_reviews_filter_newest') },
    { id: 'oldest', label: 'Cũ nhất' },
  ];

  return (
    <section
      id={id}
      className={cn(
        'rounded-2xl border border-border bg-surface p-5 shadow-[0_2px_16px_rgba(15,23,42,0.05)] tablet:p-6',
        className
      )}
      aria-labelledby="pdp-reviews-heading"
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="pdp-reviews-heading" className="text-heading text-text-primary">
          {t('pdp_reviews_title')}
        </h2>
        {totalRatings > 0 && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-caption font-medium text-primary">
            {totalRatings} đánh giá
          </span>
        )}
      </div>

      <div className="my-5 h-px bg-border/90" />

      {/* ── Rating summary ── */}
      {totalRatings > 0 ? (
        <div className="grid gap-6 tablet:grid-cols-[minmax(0,200px)_1fr] lg:grid-cols-[minmax(0,220px)_1fr_minmax(0,140px)] lg:items-start">
          <div className="flex flex-col gap-2">
            <p className="text-[2.25rem] font-bold leading-none tracking-tight text-text-primary">
              {avgRating.toFixed(1)}
            </p>
            <FractionalStars value={avgRating} size={22} />
            <p className="text-caption text-text-secondary">
              {t('pdp_reviews_count_fmt').replace('{n}', String(totalRatings))}
            </p>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            {distribution.map((row) => {
              const pct = Math.round((row.count / maxBar) * 100);
              return (
                <div key={row.stars} className="flex items-center gap-2 text-caption">
                  <span className="w-8 shrink-0 text-text-secondary">{row.stars}★</span>
                  <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-border/80">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-6 shrink-0 text-right tabular-nums text-text-secondary">
                    {row.count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* placeholder image slot */}
          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background/60 p-3 lg:items-center">
            <p className="text-caption font-medium text-text-primary">
              {t('pdp_reviews_all_images').replace('{n}', String(comments.length))}
            </p>
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-text-disabled">
              <ImageIcon size={28} strokeWidth={1.5} aria-hidden />
            </div>
          </div>
        </div>
      ) : (
        !commentsLoading && (
          <p className="text-caption text-text-secondary">
            Chưa có đánh giá nào cho sản phẩm này.
          </p>
        )
      )}

      {/* ── Comment form ── */}
      {pid != null && isAuthenticated && hasPurchased && (
        <div className="mt-6 rounded-xl border border-border/70 bg-background/50 p-4">
          <p className="mb-3 flex items-center gap-2 text-body font-semibold text-text-primary">
            <MessageCircle size={18} aria-hidden />
            Viết bình luận
          </p>
          <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-caption font-bold',
                    avatarColor(user!.id)
                  )}
                  aria-hidden
                >
                  {initials(user!.userInfo?.fullName ?? null, user!.username)}
                </div>
                <textarea
                  ref={textareaRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                  rows={3}
                  maxLength={2000}
                  className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-body text-text-primary placeholder:text-text-disabled focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {submitError && (
                <p className="text-caption text-danger">{submitError}</p>
              )}

              <div className="flex items-center justify-between">
                <p className="text-caption text-text-disabled">
                  {commentText.length}/2000
                </p>
                <button
                  type="button"
                  disabled={!commentText.trim() || createMutation.isPending}
                  onClick={() => void handleSubmit()}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-caption font-semibold text-white shadow-sm transition-opacity disabled:opacity-50 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {createMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" aria-hidden />
                  ) : (
                    <Send size={14} aria-hidden />
                  )}
                  Gửi bình luận
                </button>
              </div>
            </div>
          </div>
        )}

      {/* ── Filter tabs ── */}
      {comments.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-caption font-semibold text-text-secondary">
            {t('pdp_reviews_filter_by')}
          </p>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-caption font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  filter === f.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Comment list ── */}
      {commentsLoading && (
        <div className="mt-6 flex items-center justify-center py-8 text-text-secondary">
          <Loader2 size={22} className="animate-spin" aria-hidden />
          <span className="ml-2 text-caption">Đang tải bình luận...</span>
        </div>
      )}

      {commentsError && (
        <p className="mt-6 text-caption text-danger">Không thể tải bình luận. Vui lòng thử lại.</p>
      )}

      {!commentsLoading && !commentsError && sortedComments.length > 0 && (
        <ul className="mt-6 space-y-6 border-t border-border/80 pt-6">
          {sortedComments.map((c, idx) => (
            <li
              key={c.id}
              className={cn(
                'grid gap-4 tablet:grid-cols-[minmax(0,200px)_1fr]',
                idx > 0 && 'border-t border-border/60 pt-6'
              )}
            >
              {/* Left col — avatar + meta */}
              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-body font-bold',
                    avatarColor(c.userId)
                  )}
                  aria-hidden
                >
                  {initials(c.userFullName, c.username)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary">
                    {c.userFullName ?? c.username ?? 'Người dùng'}
                  </p>
                  {c.username && c.userFullName && (
                    <p className="mt-0.5 text-caption text-text-disabled">@{c.username}</p>
                  )}
                </div>
              </div>

              {/* Right col — content */}
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-caption font-medium text-success">
                    <CheckCircle2 size={14} aria-hidden />
                    {t('pdp_reviews_verified_purchase')}
                  </span>
                </div>

                <p className="text-body leading-relaxed text-text-secondary">{c.content}</p>

                <p className="text-caption text-text-disabled">{formatDate(c.createdDate)}</p>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-caption text-text-secondary">
                  {isAuthenticated && user?.id === c.userId && (
                    <button
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => void handleDelete(c.id)}
                      className="inline-flex items-center gap-1.5 text-danger/70 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded"
                    >
                      <Trash2 size={14} aria-hidden />
                      Xoá
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!commentsLoading && !commentsError && sortedComments.length === 0 && (
        <p className="mt-6 border-t border-border/80 pt-6 text-caption text-text-secondary">
          Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ!
        </p>
      )}
    </section>
  );
}
