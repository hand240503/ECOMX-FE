import { useQuery, useMutation } from '@tanstack/react-query';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { ChevronLeft, ImagePlus, Video, X, FileVideo, AlertCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { orderService } from '../../api/services';
import type { OrderDto } from '../../api/types/order.types';
import { Button } from '../../components/ui/Button';
import { useI18n } from '../../i18n/I18nProvider';
import { cn } from '../../lib/cn';
import { formatPrice } from '../../lib/formatPrice';
import { notify } from '../../utils/notify';

const RETURN_WINDOW_DAYS = 7;
const MAX_FILES = 5;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;   // 20 MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;  // 200 MB

function isEligibleForReturn(order: OrderDto): boolean {
  if (order.status !== 4) return false;
  if (order.returnRefundStatus != null) return false;
  const anchor = order.completedAt ?? order.paidAt;
  if (!anchor) return false;
  const d = parseISO(anchor);
  if (!isValid(d)) return false;
  return differenceInDays(new Date(), d) <= RETURN_WINDOW_DAYS;
}

function orderTotal(order: OrderDto): number {
  const lines = order.orderDetails ?? [];
  if (lines.length > 0) {
    const sum = lines.reduce((s, l) => s + (typeof l.lineTotal === 'number' ? l.lineTotal : 0), 0);
    if (sum > 0) return sum;
  }
  return typeof order.total === 'number' ? order.total : 0;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

/** Hoàn tiền mặt (đơn này hoàn về tiền mặt, không qua ví/ngân hàng). */
const REFUND_METHOD_CASH = 'CASH';

type MediaFile = {
  file: File;
  previewUrl: string | null; // object URL for images, null for videos
  id: string;
};

export default function ReturnRequestPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { orderId: orderIdParam } = useParams<{ orderId?: string }>();
  const orderId = orderIdParam ? Number.parseInt(orderIdParam, 10) : Number.NaN;
  const validId = Number.isFinite(orderId) && orderId > 0;

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Media state ─────────────────────────────────────────────────────────────
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [mediaError, setMediaError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;
    setMediaError('');
    const currentCount = mediaFiles.length;
    const remaining = MAX_FILES - currentCount;
    if (remaining <= 0) {
      setMediaError(`Tối đa ${MAX_FILES} file (ảnh + video).`);
      return;
    }

    const accepted: MediaFile[] = [];
    const rejected: string[] = [];

    Array.from(incoming).slice(0, remaining).forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      if (!isImg && !isVid) {
        rejected.push(`${file.name}: không phải ảnh hoặc video`);
        return;
      }
      if (isImg && file.size > MAX_IMAGE_BYTES) {
        rejected.push(`${file.name}: ảnh vượt 20 MB (${formatBytes(file.size)})`);
        return;
      }
      if (isVid && file.size > MAX_VIDEO_BYTES) {
        rejected.push(`${file.name}: video vượt 200 MB (${formatBytes(file.size)})`);
        return;
      }
      const previewUrl = isImg ? URL.createObjectURL(file) : null;
      accepted.push({ file, previewUrl, id: `${Date.now()}-${Math.random()}` });
    });

    if (incoming.length > remaining) {
      rejected.unshift(`Chỉ nhận thêm ${remaining} file (đã đạt giới hạn ${MAX_FILES}).`);
    }
    if (rejected.length > 0) {
      setMediaError(rejected.join(' | '));
    }
    if (accepted.length > 0) {
      setMediaFiles((prev) => [...prev, ...accepted]);
    }
    // reset input so same file can be re-picked after remove
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  }

  function removeFile(id: string) {
    setMediaFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      // revoke old object URL to avoid memory leak
      const removed = prev.find((f) => f.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
    setMediaError('');
  }

  // ── Query / mutation ─────────────────────────────────────────────────────────
  const orderQuery = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: validId,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: Parameters<typeof orderService.submitReturnRequest>[1]) =>
      orderService.submitReturnRequest(orderId, payload),
    onSuccess: () => {
      notify.success(t('return_page_success'));
      navigate(`/orders/${orderId}`);
    },
    onError: (err: Error) => {
      notify.error(err.message);
    },
  });

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!reason) next.reason = t('return_page_error_reason');
    if (!description.trim()) next.description = t('return_page_error_desc');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    submitMutation.mutate({
      reason: `${reason}${description ? ' — ' + description : ''}`,
      refundMethod: REFUND_METHOD_CASH,
      files: mediaFiles.map((mf) => mf.file),
    });
  };

  const order = orderQuery.data;
  const eligible = order ? isEligibleForReturn(order) : null;
  const refundAmount = order ? orderTotal(order) : 0;

  // ── no orderId in URL ────────────────────────────────────────────────────────
  if (!validId) {
    return (
      <div className="py-8 text-center">
        <p className="mb-4 text-body text-text-secondary">
          {t('return_page_order_not_found')}
        </p>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-body font-medium text-primary hover:underline"
        >
          <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          {t('orders_detail_back_link')}
        </Link>
      </div>
    );
  }

  if (orderQuery.isLoading) {
    return (
      <div className="animate-pulse py-8 text-center text-text-secondary">
        {t('return_page_loading')}
      </div>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <div className="py-8 text-center text-danger">
        {t('return_page_order_not_found')}
      </div>
    );
  }

  if (eligible === false) {
    return (
      <div className="py-4">
        <Link
          to={`/orders/${orderId}`}
          className="mb-5 inline-flex items-center gap-1 text-body text-text-secondary hover:text-primary hover:underline"
        >
          <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          {t('return_page_back_orders')}
        </Link>
        <div className="rounded-lg border border-warning/50 bg-amber-50/80 px-6 py-8 text-center dark:bg-amber-950/20">
          <p className="m-0 text-body font-medium text-warning">{t('return_page_not_eligible')}</p>
        </div>
      </div>
    );
  }

  const canAddMore = mediaFiles.length < MAX_FILES;

  // ── main form ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">

      <Link
        to={`/orders/${orderId}`}
        className="mb-4 inline-flex items-center gap-1 text-body text-text-secondary hover:text-primary hover:underline"
      >
        <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
        {t('return_page_back_orders')}
      </Link>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">

        {/* Situation */}
        <section className="rounded-lg border border-border bg-surface px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-caption text-text-secondary">{t('return_page_situation_label')}</span>
            <button type="button" className="text-caption font-medium text-primary hover:underline">
              {t('return_page_change')}
            </button>
          </div>
          <p className="mt-1 m-0 text-body font-semibold text-text-primary">
            {t('return_page_situation_value')}
          </p>
        </section>

        {/* Selected products */}
        <section className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h2 className="m-0 text-body font-semibold text-text-primary">
              {t('return_page_selected_products')}
            </h2>
          </div>
          <ul className="m-0 list-none divide-y divide-border p-0">
            {(order.orderDetails ?? []).map((line) => (
              <li key={line.id} className="flex items-center gap-3 px-4 py-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-sm border border-border bg-background">
                  {line.thumbnail_url ?? line.thumbnailUrl ? (
                    <img
                      src={(line.thumbnail_url ?? line.thumbnailUrl) as string}
                      alt={line.productName ?? `Product #${line.productId}`}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="m-0 line-clamp-2 text-body font-medium text-text-primary">
                    {line.productName ?? `Product #${line.productId}`}
                  </p>
                  <p className="mt-0.5 m-0 text-caption text-text-secondary">
                    {t('return_page_qty_label').replace('{qty}', String(line.quantity))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Return form */}
        <section className="rounded-lg border border-border bg-surface px-4 py-4 shadow-sm">
          <h2 className="m-0 mb-4 text-body font-semibold text-text-primary">
            {t('return_page_form_title')}
          </h2>

          {/* Reason */}
          <div className="mb-4">
            <label className="mb-1.5 block text-caption font-medium text-text-primary">
              <span className="text-danger mr-0.5">*</span>
              {t('return_page_reason_label')}
            </label>
            <select
              value={reason}
              onChange={(e) => { setReason(e.target.value); setErrors((p) => ({ ...p, reason: '' })); }}
              className={cn(
                'w-full rounded-sm border bg-background px-3 py-2 text-body text-text-primary',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.reason ? 'border-danger' : 'border-border'
              )}
            >
              <option value="">{t('return_page_reason_placeholder')}</option>
              <option value="defective">{t('return_page_reason_defective')}</option>
              <option value="missing">{t('return_page_reason_missing')}</option>
              <option value="wrong">{t('return_page_reason_wrong')}</option>
              <option value="not_as_described">{t('return_page_reason_not_as_described')}</option>
              <option value="other">{t('return_page_reason_other')}</option>
            </select>
            {errors.reason ? (
              <p className="mt-1 m-0 text-caption text-danger">{errors.reason}</p>
            ) : null}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1.5 block text-caption font-medium text-text-primary">
              <span className="text-danger mr-0.5">*</span>
              {t('return_page_desc_label')}
            </label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: '' })); }}
              placeholder={t('return_page_desc_placeholder')}
              maxLength={2000}
              rows={4}
              className={cn(
                'w-full resize-none rounded-sm border bg-background px-3 py-2',
                'text-body text-text-primary placeholder:text-text-disabled',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                errors.description ? 'border-danger' : 'border-border'
              )}
            />
            <div className="mt-1 flex items-center justify-between gap-2">
              {errors.description ? (
                <p className="m-0 text-caption text-danger">{errors.description}</p>
              ) : <span />}
              <p className="m-0 text-right text-caption text-text-disabled">
                {description.length}/2000
              </p>
            </div>
          </div>

          {/* ── Media upload ─────────────────────────────────────────────── */}
          <div>
            <p className="mb-1.5 text-caption font-medium text-text-primary">
              {t('return_page_media_label')}
            </p>
            <p className="mb-2 text-caption text-text-secondary">
              Tối đa {MAX_FILES} file · Ảnh ≤ 20 MB · Video ≤ 200 MB
            </p>

            {/* Preview grid */}
            {mediaFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {mediaFiles.map((mf) => (
                  <div
                    key={mf.id}
                    className="relative size-20 shrink-0 overflow-hidden rounded-sm border border-border bg-background"
                  >
                    {mf.previewUrl ? (
                      <img
                        src={mf.previewUrl}
                        alt={mf.file.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-1 px-1">
                        <FileVideo className="size-6 text-text-secondary" strokeWidth={1.5} aria-hidden />
                        <span
                          className="w-full truncate text-center text-[10px] text-text-secondary leading-tight"
                          title={mf.file.name}
                        >
                          {mf.file.name}
                        </span>
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFile(mf.id)}
                      aria-label={`Xóa file ${mf.file.name}`}
                      className={cn(
                        'absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full',
                        'bg-black/60 text-white hover:bg-black/80 transition-colors'
                      )}
                    >
                      <X className="size-3" strokeWidth={2.5} aria-hidden />
                    </button>
                    {/* Size badge */}
                    <span className="absolute bottom-0.5 left-0.5 rounded bg-black/50 px-1 py-0.5 text-[9px] text-white leading-none">
                      {formatBytes(mf.file.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add buttons — ẩn khi đã đạt tối đa số file */}
            {canAddMore ? (
              <div className="flex gap-2">
                {/* Image picker */}
                <label
                  className={cn(
                    'flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1',
                    'rounded-sm border-2 border-dashed border-border bg-background',
                    'text-caption text-text-secondary transition-colors',
                    'hover:border-primary hover:text-primary'
                  )}
                  title="Thêm ảnh"
                >
                  <ImagePlus className="size-5" strokeWidth={1.5} aria-hidden />
                  <span>{t('return_page_add_image')}</span>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </label>

                {/* Video picker */}
                <label
                  className={cn(
                    'flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1',
                    'rounded-sm border-2 border-dashed border-border bg-background',
                    'text-caption text-text-secondary transition-colors',
                    'hover:border-primary hover:text-primary'
                  )}
                  title="Thêm video"
                >
                  <Video className="size-5" strokeWidth={1.5} aria-hidden />
                  <span>{t('return_page_add_video')}</span>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </label>

                {/* Counter chip */}
                {mediaFiles.length > 0 && (
                  <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-sm border border-border bg-background text-caption text-text-secondary">
                    <span className="text-lg font-semibold text-text-primary leading-none">
                      {mediaFiles.length}/{MAX_FILES}
                    </span>
                    <span>file</span>
                  </div>
                )}
              </div>
            ) : (
              /* Đã đạt tối đa — hiện banner thay cho nút thêm */
              <div className="flex items-center gap-2 rounded-sm border border-warning/50 bg-amber-50/80 px-3 py-2.5 dark:bg-amber-950/20">
                <AlertCircle className="size-4 shrink-0 text-warning" strokeWidth={2} aria-hidden />
                <p className="m-0 text-caption font-medium text-warning">
                  Đã đạt tối đa {MAX_FILES} file ({mediaFiles.length}/{MAX_FILES}). Xoá bớt ảnh/video để thêm file khác.
                </p>
              </div>
            )}

            {/* Media error (vượt số lượng / kích thước / sai định dạng) */}
            {mediaError && (
              <div className="mt-2 flex items-start gap-2 rounded-sm border border-danger/40 bg-danger/5 px-3 py-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={2} aria-hidden />
                <p className="m-0 text-caption text-danger">{mediaError}</p>
              </div>
            )}
          </div>
        </section>

        {/* Method */}
        <section className="rounded-lg border border-border bg-surface px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-body font-medium text-text-primary">
              {t('return_page_method_label')}
            </span>
            <span className="text-body font-semibold text-primary">
              {t('return_page_method_return_refund')}
            </span>
          </div>
        </section>

        {/* Refund info */}
        <section className="rounded-lg border border-border bg-surface px-4 py-4 shadow-sm">
          <h2 className="m-0 mb-4 text-body font-semibold text-text-primary">
            {t('return_page_refund_info_title')}
          </h2>

          <div className="mb-3 flex items-center justify-between border-b border-dotted border-border pb-3">
            <span className="text-caption text-text-secondary">{t('return_page_refund_amount_label')}</span>
            <span className="font-semibold tabular-nums text-text-primary">{formatPrice(refundAmount)}</span>
          </div>

          {/* Hình thức hoàn tiền: Tiền mặt */}
          <div className="mb-4">
            <p className="mb-2 text-caption font-medium text-text-primary">
              {t('return_page_refund_to_label')}
            </p>
            <div className="inline-flex items-center gap-2 rounded-sm border border-primary bg-primary/10 px-4 py-2 text-caption font-medium text-primary">
              {t('return_page_refund_cash')}
            </div>
          </div>

          {/* Refund summary */}
          <div className="mt-4 space-y-1 border-t border-border pt-3">
            <div className="flex justify-between text-caption text-text-secondary">
              <span>{t('return_page_refund_total')}</span>
              <span className="tabular-nums">{formatPrice(refundAmount)}</span>
            </div>
            <div className="flex justify-between text-body font-bold text-primary">
              <span>{t('return_page_refund_final')}</span>
              <span className="tabular-nums text-[1.125rem]">{formatPrice(refundAmount)}</span>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="flex justify-end pb-4">
          <Button
            type="submit"
            variant="profilePrimary"
            size="md"
            loading={submitMutation.isPending}
            disabled={submitMutation.isPending}
            className="min-w-[140px] rounded-sm"
          >
            {submitMutation.isPending ? t('return_page_submitting') : t('return_page_submit')}
          </Button>
        </div>

      </form>
    </div>
  );
}
