import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, Ticket, Truck } from 'lucide-react';
import MainHeader from '../layout/header/MainHeader';
import MainFooter from '../layout/footer/MainFooter';
import CartPageRecommendations from '../components/cart/CartPageRecommendations';
import EmptyCartIllustration from '../components/cart/EmptyCartIllustration';
import { QuantityInput } from '../components/product/QuantityInput';
import { Button } from '../components/ui/Button';
import { useI18n } from '../i18n/I18nProvider';
import { useCart } from '../app/cart/CartProvider';
import { useEcomxCartProductDetails, cartLineDisplayFromByIds } from '../hooks/useEcomxCartProductDetails';
import { cartLineKey, parseCartLineKey, type CartLine } from '../lib/cartStorage';
import { isProductFreeship } from '../lib/categoryProductUtils';
import { formatPrice } from '../lib/formatPrice';
import { formatCartLineAddedAt } from '../lib/formatCartLineDate';
import { cn } from '../lib/cn';
import type { Lang } from '../utils/i18n';
import type { ProductFullResponse } from '../api/types/product.types';

const TABLE_HEAD =
  'hidden sm:grid sm:grid-cols-[1.5rem_1fr_5.5rem_6.5rem_5.5rem_4.5rem] sm:items-center sm:gap-3 sm:px-4 sm:py-2.5';
const ROW_GRID =
  'sm:grid sm:grid-cols-[1.5rem_1fr_5.5rem_6.5rem_5.5rem_4.5rem] sm:items-center sm:gap-3 sm:px-4 sm:py-4';

const qtyClass =
  '!h-8 !shadow-none rounded border-[#e5e5e5] sm:justify-self-center [&_button]:!h-8 [&_button]:!w-7 [&_input]:!h-8 [&_input]:!w-9 [&_input]:!text-sm';

type RowInnerProps = {
  line: CartLine;
  k: string;
  checked: boolean;
  display: { productName: string; thumbnailUrl: string | null };
  product: ProductFullResponse | undefined;
  t: (key: string) => string;
  lang: Lang;
  onToggle: (key: string, c: boolean) => void;
  onQuantity: (n: number) => void;
  onRemove: () => void;
};

function CartLineDesktop(props: RowInnerProps) {
  const { line, k, checked, display, product, t, lang, onToggle, onQuantity, onRemove } = props;
  const simHref = `/search?q=${encodeURIComponent(display.productName)}`;
  const freeship = product ? isProductFreeship(product) : false;

  return (
    <div
      className={cn(ROW_GRID, 'hidden sm:grid', !checked && 'bg-[#fafafa]/90')}
    >
      <label className="flex h-4 cursor-pointer items-center justify-center">
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer rounded border-[#c8c8c8] text-[#ee4d2d] accent-[#ee4d2d]"
          checked={checked}
          onChange={(e) => onToggle(k, e.target.checked)}
          aria-label={t('cart_line_checkbox_aria')}
        />
      </label>

      <div className="flex min-w-0 gap-2.5">
        <Link
          to={`/products/${line.productId}`}
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-[#e8e8e8] bg-[#fafafa]"
        >
          {display.thumbnailUrl ? (
            <img src={display.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">—</div>
          )}
        </Link>
        <div className="min-w-0 flex-1 pr-1">
          <Link
            to={`/products/${line.productId}`}
            className="line-clamp-2 text-left text-sm font-normal text-gray-900 hover:text-[#1a94ff] hover:underline"
          >
            {display.productName}
          </Link>
          {freeship && (
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              <span className="inline-block rounded border border-[#00bfa5] px-1 py-0.5 text-[10px] font-medium text-[#00bfa5]">
                {t('cart_freeship_badge')}
              </span>
            </div>
          )}
          <p className="mt-1.5 text-xs text-gray-500">
            {t('cart_variant_label')}: {line.unitName}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {t('cart_line_added_at')}: {formatCartLineAddedAt(line.addedAt, lang)}
          </p>
        </div>
      </div>

      <div className="flex min-h-8 items-center justify-center sm:justify-self-center">
        <span className="text-right text-sm text-gray-800">{formatPrice(line.unitPrice)}</span>
      </div>

      <div className="flex min-h-8 items-center justify-center sm:justify-self-center">
        <QuantityInput value={line.quantity} onChange={onQuantity} min={1} className={qtyClass} />
      </div>

      <div
        className={cn(
          'flex min-h-8 items-center justify-center sm:justify-self-center',
          'text-right text-sm font-medium',
          checked ? 'text-[#ee4d2d]' : 'text-gray-500'
        )}
      >
        {formatPrice(line.unitPrice * line.quantity)}
      </div>

      <div className="flex min-w-0 w-full max-w-full flex-col items-center justify-center gap-1.5 self-center text-center text-xs sm:justify-self-center">
        <button
          type="button"
          onClick={onRemove}
          className="flex w-full items-center justify-center text-center text-[#1a94ff] hover:underline"
        >
          {t('cart_remove')}
        </button>
        <Link
          to={simHref}
          className="flex w-full items-center justify-center text-center line-clamp-2 min-h-10 text-[#1a94ff] hover:underline"
        >
          {t('cart_find_similar')}
        </Link>
      </div>
    </div>
  );
}

function CartLineMobile(props: RowInnerProps) {
  const { line, k, checked, display, product, t, lang, onToggle, onQuantity, onRemove } = props;
  const simHref = `/search?q=${encodeURIComponent(display.productName)}`;
  const freeship = product ? isProductFreeship(product) : false;

  return (
    <div
      className={cn('border-b border-[#e8e8e8] p-3 sm:hidden', !checked && 'bg-[#fafafa]')}
    >
      <div className="flex gap-2.5">
        <label className="mt-0.5 flex h-4 shrink-0 cursor-pointer items-center">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-[#c8c8c8] text-[#ee4d2d] accent-[#ee4d2d]"
            checked={checked}
            onChange={(e) => onToggle(k, e.target.checked)}
            aria-label={t('cart_line_checkbox_aria')}
          />
        </label>
        <Link
          to={`/products/${line.productId}`}
          className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded border border-[#e8e8e8] bg-[#fafafa]"
        >
          {display.thumbnailUrl ? (
            <img src={display.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-gray-400">—</div>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/products/${line.productId}`}
            className="line-clamp-2 text-sm font-normal leading-snug text-gray-900 hover:text-[#1a94ff] hover:underline"
          >
            {display.productName}
          </Link>
          {freeship && (
            <span className="mt-0.5 inline-block rounded border border-[#00bfa5] px-1 py-0.5 text-[10px] font-medium leading-tight text-[#00bfa5]">
              {t('cart_freeship_badge')}
            </span>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {t('cart_variant_label')}: {line.unitName}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">
            {t('cart_line_added_at')}: {formatCartLineAddedAt(line.addedAt, lang)}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2.5 pl-6 text-sm">
        <div className="flex min-h-8 items-center justify-between text-gray-600">
          <span className="flex min-h-8 items-center">{t('cart_table_unit_price')}</span>
          <span className="flex min-h-8 items-center text-gray-900">{formatPrice(line.unitPrice)}</span>
        </div>
        <div className="flex min-h-8 items-center justify-between">
          <span className="flex items-center text-gray-600">{t('cart_table_quantity')}</span>
          <div className="flex items-center">
            <QuantityInput value={line.quantity} onChange={onQuantity} min={1} className={qtyClass} />
          </div>
        </div>
        <div className="flex min-h-8 items-center justify-between">
          <span className="flex items-center text-gray-600">{t('cart_table_subtotal')}</span>
          <span
            className={cn(
              'flex items-center text-base font-medium',
              checked ? 'text-[#ee4d2d]' : 'text-gray-500'
            )}
          >
            {formatPrice(line.unitPrice * line.quantity)}
          </span>
        </div>
      </div>
      <div className="mt-2 flex w-full flex-col items-center gap-1.5 px-3 text-xs sm:hidden">
        <button
          type="button"
          onClick={onRemove}
          className="flex w-full items-center justify-center text-center text-[#1a94ff] hover:underline"
        >
          {t('cart_remove')}
        </button>
        <Link
          to={simHref}
          className="flex min-h-10 w-full items-center justify-center text-center text-[#1a94ff] hover:underline"
        >
          {t('cart_find_similar')}
        </Link>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { t, lang } = useI18n();
  const { lines, setQuantity, removeItem } = useCart();
  const { byId } = useEcomxCartProductDetails(lines);
  const isEmpty = lines.length === 0;

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const prevLineKeySet = useRef<Set<string>>(new Set());
  const masterHeaderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const lineKeySet = new Set(lines.map(cartLineKey));
    setSelectedKeys((prev) => {
      const next = new Set<string>();
      for (const k of prev) {
        if (lineKeySet.has(k)) next.add(k);
      }
      for (const l of lines) {
        const k = cartLineKey(l);
        if (!prevLineKeySet.current.has(k)) {
          next.add(k);
        }
      }
      return next;
    });
    prevLineKeySet.current = new Set(lineKeySet);
  }, [lines]);

  const isAllSelected = lines.length > 0 && selectedKeys.size === lines.length;
  const isPartial = selectedKeys.size > 0 && !isAllSelected;

  useEffect(() => {
    if (masterHeaderRef.current) {
      masterHeaderRef.current.indeterminate = isPartial;
    }
  }, [isPartial]);

  const selectedSubtotal = useMemo(() => {
    let sum = 0;
    for (const l of lines) {
      if (!selectedKeys.has(cartLineKey(l))) continue;
      sum += l.unitPrice * l.quantity;
    }
    return sum;
  }, [lines, selectedKeys]);

  const toggleKey = useCallback((key: string, checked: boolean) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedKeys(new Set(lines.map(cartLineKey)));
  }, [lines]);

  const deselectAll = useCallback(() => {
    setSelectedKeys(new Set());
  }, []);

  const onMasterInput = useCallback(() => {
    if (isAllSelected) deselectAll();
    else selectAll();
  }, [isAllSelected, deselectAll, selectAll]);

  const deleteSelected = useCallback(() => {
    for (const k of selectedKeys) {
      const pair = parseCartLineKey(k);
      if (pair) removeItem(pair.productId, pair.unitId);
    }
  }, [selectedKeys, removeItem]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f5f5]">
      <MainHeader />

      <main className="flex-1 py-6">
        <div className="mx-auto w-full max-w-container px-4 tablet:px-6">
          <h1 className="mb-4 text-lg font-bold uppercase tracking-wide text-gray-900">
            {t('cart_page_heading')}
          </h1>

          {isEmpty ? (
            <div className="rounded border border-[#e8e8e8] bg-white px-4 py-14 shadow-sm tablet:px-8 tablet:py-16">
              <div className="mx-auto flex max-w-md flex-col items-center text-center">
                <EmptyCartIllustration className="mb-6 h-[7.5rem] w-[9.5rem] tablet:h-32 tablet:w-40" />
                <p className="text-lg font-bold text-gray-900 tablet:text-xl">{t('cart_empty_title')}</p>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-gray-600 tablet:text-base">
                  {t('cart_empty_subtitle')}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded border border-[#e8e8e8] bg-white">
              <div className="flex flex-col gap-2.5 border-b border-[#e8e8e8] bg-[#f9f9f9] p-2.5 sm:flex-row sm:items-center sm:gap-2 sm:p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    disabled={isAllSelected}
                    className="border-[#e0e0e0] text-xs"
                  >
                    {t('cart_select_all')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    disabled={selectedKeys.size === 0}
                    className="border-[#e0e0e0] text-xs"
                  >
                    {t('cart_deselect_all')}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={deleteSelected}
                    disabled={selectedKeys.size === 0}
                    className="text-xs"
                  >
                    {t('cart_delete_selected')}
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  TABLE_HEAD,
                  'border-b border-[#e8e8e8] bg-white text-xs font-medium text-gray-500'
                )}
              >
                <label className="flex h-4 cursor-pointer items-center sm:justify-center">
                  <input
                    ref={masterHeaderRef}
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-[#c8c8c8] text-[#ee4d2d] accent-[#ee4d2d]"
                    checked={isAllSelected}
                    onChange={onMasterInput}
                    aria-label={t('cart_table_select_all_aria')}
                  />
                </label>
                <span className="flex min-h-8 items-center text-left">{t('cart_table_product')}</span>
                <span className="flex min-h-8 items-center justify-center text-center">
                  {t('cart_table_unit_price')}
                </span>
                <span className="flex min-h-8 items-center justify-center text-center">
                  {t('cart_table_quantity')}
                </span>
                <span className="flex min-h-8 items-center justify-center text-center">
                  {t('cart_table_subtotal')}
                </span>
                <span className="flex min-h-8 items-center justify-center text-center">
                  {t('cart_table_actions')}
                </span>
              </div>

              <ul className="m-0 list-none p-0">
                {lines.map((line) => {
                  const k = cartLineKey(line);
                  const checked = selectedKeys.has(k);
                  const display = cartLineDisplayFromByIds(line, byId);
                  const product = byId.get(line.productId);
                  const base: RowInnerProps = {
                    line,
                    k,
                    checked,
                    display,
                    product,
                    t,
                    lang,
                    onToggle: toggleKey,
                    onQuantity: (n) =>
                      setQuantity(line.productId, line.unitId, Math.min(999, Math.max(1, n))),
                    onRemove: () => removeItem(line.productId, line.unitId),
                  };
                  return (
                    <li key={k} className="border-b border-[#e8e8e8] last:border-b-0">
                      <CartLineMobile {...base} />
                      <CartLineDesktop {...base} />
                    </li>
                  );
                })}
              </ul>

              <button
                type="button"
                className="flex w-full cursor-pointer items-center justify-between border-t border-[#e8e8e8] bg-white px-3 py-2.5 text-left text-sm text-[#1a94ff] transition-colors hover:bg-[#f0f9ff] sm:px-4"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Ticket className="h-4 w-4 shrink-0 text-[#1a94ff]" strokeWidth={2} />
                  <span>{t('cart_add_voucher')}</span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-[#1a94ff]" strokeWidth={2} />
              </button>
              <div className="flex items-start gap-2 border-t border-[#e8e8e8] bg-white px-3 py-2.5 text-xs leading-snug text-gray-600 sm:px-4">
                <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                <p>{t('cart_shipping_hint')}</p>
              </div>

              <div className="flex flex-col gap-3 border-t border-[#e8e8e8] bg-[#fafcff] px-4 py-4 sm:px-6">
                <p className="text-right text-body text-gray-700">
                  <span className="text-text-secondary">{t('pdp_subtotal')}</span>{' '}
                  <span
                    className={cn(
                      'text-lg font-bold',
                      selectedSubtotal === 0 ? 'text-gray-400' : 'text-[#ee4d2d]'
                    )}
                  >
                    {formatPrice(selectedSubtotal)}
                  </span>
                </p>
                <Button
                  type="button"
                  variant="profilePrimary"
                  size="lg"
                  className="h-12 w-full max-w-md self-end rounded border-0 bg-[#ee4d2d] text-base font-medium text-white shadow-sm hover:brightness-105 sm:self-end"
                  disabled={selectedSubtotal === 0}
                  onClick={() => {
                    /* Thanh toán khi có route */
                  }}
                >
                  {t('cart_buy')}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-8">
            <CartPageRecommendations />
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  );
}
