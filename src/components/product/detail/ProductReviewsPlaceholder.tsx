import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Loader2, Pencil, Star, Trash2, X } from 'lucide-react';
import { useI18n } from '../../../i18n/I18nProvider';
import { cn } from '../../../lib/cn';
import { useAuth } from '../../../app/auth/AuthProvider';
import { useProductComments } from '../../../hooks/useProductComments';
import { ratingService } from '../../../api/services';
import { notify } from '../../../utils/notify';

// ─── Fractional stars (tổng quan) ─────────────────────────────────────────────
function FractionalStars({ value, size = 20 }: { value: number; size?: number }) {
  const v = Math.min(5, Math.max(0, value));
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, v - i));
        return (
          <div key={i} className="relative shrink-0" style={{ width: size, height: size }}>
            <Star size={size} className="absolute text-border" strokeWidth={2} fill="none" />
            <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="fill-warning text-warning" strokeWidth={0} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Hàng sao đặc (1 review) ──────────────────────────────────────────────────
function StarRow({ value, size = 15 }: { value: number; size?: number }) {
  const n = Math.round(Math.min(5, Math.max(0, value)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${n}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={cn(i < n ? 'fill-warning text-warning' : 'fill-none text-border')}
          strokeWidth={i < n ? 0 : 2}
        />
      ))}
    </div>
  );
}

// ─── Ô chấm sao tương tác (khi sửa) ───────────────────────────────────────────
function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}`}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className="rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Star
            size={22}
            className={cn(n <= active ? 'fill-warning text-warning' : 'fill-none text-border')}
            strokeWidth={n <= active ? 0 : 2}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-warning/15 text-warning',
  'bg-success/15 text-success',
  'bg-violet-100 text-violet-700',
  'bg-pink-100 text-pink-700',
];
function avatarColor(userId: number) {
  return AVATAR_COLORS[Math.abs(userId) % AVATAR_COLORS.length];
}
function ReviewAvatar({
  avatar,
  name,
  userId,
}: {
  avatar?: string | null;
  name: string;
  userId: number;
}) {
  if (avatar && avatar.trim()) {
    return (
      <img
        src={avatar}
        alt={name}
        className="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <div
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-body font-bold',
        avatarColor(userId)
      )}
      aria-hidden
    >
      {(name[0] ?? '?').toUpperCase()}
    </div>
  );
}

// ─── Date formatter ───────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterId>('newest');

  const pid = productId ?? null;

  const { avgRating, totalRatings, ratings, ratingsLoading } = useProductComments(pid);

  // ── Trạng thái sửa/xoá ──────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['product-ratings', pid] });

  const startEdit = (r: { id: number; rating: number; comment: string | null }) => {
    setEditingId(r.id);
    setEditRating(Math.round(r.rating) || 5);
    setEditComment(r.comment ?? '');
  };
  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (ratingId: number) => {
    setBusyId(ratingId);
    try {
      await ratingService.update(ratingId, {
        rating: editRating,
        comment: editComment.trim() === '' ? undefined : editComment.trim(),
      });
      await invalidate();
      setEditingId(null);
      notify.success('Đã cập nhật đánh giá');
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Cập nhật đánh giá thất bại');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (ratingId: number) => {
    if (typeof window !== 'undefined' && !window.confirm('Xoá đánh giá này?')) return;
    setBusyId(ratingId);
    try {
      await ratingService.remove(ratingId);
      await invalidate();
      if (editingId === ratingId) setEditingId(null);
      notify.success('Đã xoá đánh giá');
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Xoá đánh giá thất bại');
    } finally {
      setBusyId(null);
    }
  };

  // ── Phân bố sao ─────────────────────────────────────────────────────────────
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    stars: star,
    count: ratings.filter((r) => Math.round(r.rating) === star).length,
  }));
  const maxBar = Math.max(...distribution.map((d) => d.count), 1);

  const sortedReviews = useMemo(() => {
    return [...ratings].sort((a, b) => {
      const ta = new Date(a.createdDate).getTime();
      const tb = new Date(b.createdDate).getTime();
      return filter === 'newest' ? tb - ta : ta - tb;
    });
  }, [ratings, filter]);

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
                  <span className="w-6 shrink-0 text-right tabular-nums text-text-secondary">{row.count}</span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border/80 bg-background/60 p-3 lg:items-center">
            <p className="text-caption font-medium text-text-primary">
              {t('pdp_reviews_all_images').replace('{n}', '0')}
            </p>
            <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border bg-surface text-text-disabled">
              <ImageIcon size={28} strokeWidth={1.5} aria-hidden />
            </div>
          </div>
        </div>
      ) : (
        !ratingsLoading && (
          <p className="text-caption text-text-secondary">Chưa có đánh giá nào cho sản phẩm này.</p>
        )
      )}

      {ratings.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-caption font-semibold text-text-secondary">{t('pdp_reviews_filter_by')}</p>
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

      {ratingsLoading && (
        <div className="mt-6 flex items-center justify-center py-8 text-text-secondary">
          <Loader2 size={22} className="animate-spin" aria-hidden />
          <span className="ml-2 text-caption">Đang tải đánh giá...</span>
        </div>
      )}

      {!ratingsLoading && sortedReviews.length > 0 && (
        <ul className="mt-6 space-y-6 border-t border-border/80 pt-6">
          {sortedReviews.map((r, idx) => {
            const name = r.fullName?.trim() || r.username || 'Người dùng';
            const isOwn = isAuthenticated && user?.id === r.userId;
            const isEditing = editingId === r.id;
            const busy = busyId === r.id;
            return (
              <li key={r.id} className={cn('flex gap-3', idx > 0 && 'border-t border-border/60 pt-6')}>
                <ReviewAvatar avatar={r.avatar} name={name} userId={r.userId} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="m-0 font-semibold text-text-primary">{name}</p>
                    {isOwn && !isEditing && (
                      <div className="flex items-center gap-3 text-caption">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => startEdit(r)}
                          className="inline-flex items-center gap-1 text-text-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded disabled:opacity-50"
                        >
                          <Pencil size={14} aria-hidden /> Sửa
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDelete(r.id)}
                          className="inline-flex items-center gap-1 text-danger/70 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded disabled:opacity-50"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Trash2 size={14} aria-hidden />} Xoá
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <StarInput value={editRating} onChange={setEditRating} />
                      <textarea
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Chia sẻ cảm nhận của bạn..."
                        className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-body text-text-primary placeholder:text-text-disabled focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void saveEdit(r.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-caption font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {busy ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}
                          Lưu thay đổi
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-caption font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
                        >
                          <X size={14} aria-hidden /> Huỷ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <StarRow value={r.rating} size={15} />
                      <p className="m-0 text-caption text-text-disabled">{formatDate(r.createdDate)}</p>
                      {r.comment?.trim() ? (
                        <p className="m-0 whitespace-pre-line pt-1 text-body leading-relaxed text-text-secondary">
                          {r.comment.trim()}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!ratingsLoading && sortedReviews.length === 0 && totalRatings === 0 && (
        <p className="mt-6 border-t border-border/80 pt-6 text-caption text-text-secondary">
          Chưa có đánh giá nào. Mua hàng và đánh giá từ trang đơn hàng của bạn nhé!
        </p>
      )}
    </section>
  );
}
