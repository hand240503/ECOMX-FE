import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useCart } from '../../app/cart/CartProvider';
import ProductFeed from '../home/ProductFeed';
import CartItemHybridProductFeed from './CartItemHybridProductFeed';

/**
 * Giỏ trống: gợi ý theo dòng cũ (home). Có sản phẩm: gợi ý theo từng mặt hàng (item-hybrid) rồi gộp.
 * @see docs/API_recommendation_item_hybrid_FE.md
 */
const CartPageRecommendations = () => {
  const { t } = useI18n();
  const { lines } = useCart();

  const cartProductIds = useMemo(() => {
    const seen = new Set<number>();
    const out: number[] = [];
    for (const l of lines) {
      if (seen.has(l.productId)) continue;
      seen.add(l.productId);
      out.push(l.productId);
    }
    return out;
  }, [lines]);

  if (cartProductIds.length === 0) {
    return <ProductFeed title={t('cart_recommendations_title')} maxItems={10} />;
  }

  return <CartItemHybridProductFeed cartProductIds={cartProductIds} title={t('cart_recommendations_title')} />;
};

export default CartPageRecommendations;
