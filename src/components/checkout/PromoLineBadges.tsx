/**
 * PromoLineBadges — hiển thị các badge ưu đãi đang áp dụng trên một dòng thanh toán.
 *
 * Logic hiển thị theo snapshot từ BE (`OrderLinePricingProgramsSnapshot`):
 *   - PC  (price_change)         → badge đỏ/cam: "Khuyến mãi | Giá gốc: X"
 *   - VolumeT (volume_tier)      → badge xanh dương: "Giá sỉ từ N sản phẩm"
 *   - PwP (purchase_with_purchase) → badge xanh lá: "Mua kèm ưu đãi: X" hoặc mixed nếu vừa promo vừa regular
 *
 * Component này thuần trình bày — nhận snapshot và formatter, không gọi API.
 */

import type { OrderLinePricingProgramsSnapshot } from '../../api/types/order.types';
import { useI18n } from '../../i18n/I18nProvider';
import { formatPrice } from '../../lib/formatPrice';

type Props = {
  /** Snapshot pricing_programs từ BE; null/undefined = không hiển thị gì. */
  programs: OrderLinePricingProgramsSnapshot | null | undefined;
  /** Số lượng dòng này (để tính lineTotal trung bình khi PwP mixed). */
  quantity?: number | null;
};

export function PromoLineBadges({ programs, quantity: _quantity }: Props) {
  const { t } = useI18n();

  if (!programs) return null;

  const { price_change: pc, volume_tier: vol, purchase_with_purchase: pwp } = programs;

  const hasAnyPromo = pc != null || vol != null || pwp != null;
  if (!hasAnyPromo) return null;

  return (
    <ul className="m-0 mt-1.5 list-none space-y-1 p-0">
      {/* ── PC (Price Change) ───────────────────────────────────────────────── */}
      {pc != null && (
        <li className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-sm bg-danger/10 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-danger">
            {t('promo_badge_pc_label')}
          </span>
          {pc.base_price != null && pc.sale_price != null && (
            <span className="text-[11px] text-text-secondary line-through">
              {formatPrice(pc.base_price)}
            </span>
          )}
          {pc.base_price != null && pc.sale_price == null && (
            <span className="text-[11px] text-text-secondary">
              {t('promo_badge_pc_original').replace('{price}', formatPrice(pc.base_price))}
            </span>
          )}
        </li>
      )}

      {/* ── Volume Tier (mix-and-match) ─────────────────────────────────────── */}
      {vol != null && vol.min_quantity != null && (
        <li>
          <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary">
            {t('promo_badge_volume_label').replace('{min}', String(vol.min_quantity))}
          </span>
        </li>
      )}

      {/* ── PwP (Purchase with Purchase) ────────────────────────────────────── */}
      {pwp != null && (() => {
        const promoQty   = pwp.promo_quantity   ?? 0;
        const regularQty = pwp.regular_quantity ?? 0;
        const promoPrice = pwp.promo_unit_price;
        const regPrice   = pwp.regular_unit_price_after_programs;

        // Toàn bộ dòng được hưởng giá PwP (không có phần regular)
        if (promoQty > 0 && regularQty === 0 && promoPrice != null) {
          return (
            <li>
              <span className="inline-flex items-center rounded-sm bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-success">
                {t('promo_badge_pwp_label').replace('{price}', formatPrice(promoPrice))}
              </span>
            </li>
          );
        }

        // Mixed: một phần promo, một phần regular
        if (promoQty > 0 && regularQty > 0 && promoPrice != null && regPrice != null) {
          return (
            <li>
              <span className="inline-flex items-center rounded-sm bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-success">
                {t('promo_badge_pwp_mixed')
                  .replace('{promo}', String(promoQty))
                  .replace('{promoPrice}', formatPrice(promoPrice))
                  .replace('{reg}', String(regularQty))
                  .replace('{regPrice}', formatPrice(regPrice))}
              </span>
            </li>
          );
        }

        // Có PwP offer nhưng promoQty = 0 (không đủ điều kiện) → không hiện badge
        return null;
      })()}
    </ul>
  );
}
