import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, X, Check, Store as StoreIcon } from 'lucide-react';
import { useCart } from '../../app/cart/CartProvider';
import { useAuth } from '../../app/auth/AuthProvider';
import { storeService } from '../../api/services/storeService';
import { addressService } from '../../api/services/addressService';
import { shippingService } from '../../api/services/shippingService';
import { formatAddressDetail } from '../../domain/address/formatAddressDetail';
import { formatPrice } from '../../lib/formatPrice';
import { cn } from '../../lib/cn';

type Props = {
  open: boolean;
  onClose: () => void;
  selectedStoreId: number | null;
  onSelect: (id: number) => void;
};

export default function StoreSelectorPopup({ open, onClose, selectedStoreId, onSelect }: Props) {
  const { lines } = useCart();
  const { isAuthenticated } = useAuth();

  // Lấy variant/product trong giỏ để lọc kho có hàng.
  const variantIds = useMemo(
    () =>
      Array.from(
        new Set(
          lines
            .map((l) => l.productVariantId)
            .filter((v): v is number => typeof v === 'number' && v > 0)
        )
      ),
    [lines]
  );
  const productIds = useMemo(
    () => Array.from(new Set(lines.filter((l) => !l.productVariantId).map((l) => l.productId))),
    [lines]
  );

  const storesQuery = useQuery({
    queryKey: ['store-selector', 'stocking', variantIds, productIds],
    queryFn: ({ signal }) => storeService.listStocking({ variantIds, productIds }, { signal }),
    enabled: open,
    staleTime: 60_000,
  });
  const stores = storesQuery.data ?? [];

  // Địa chỉ mặc định (nếu đã đăng nhập) → tính phí ship theo từng kho để hiển thị.
  const addressesQuery = useQuery({
    queryKey: ['store-selector', 'addresses'],
    queryFn: () => addressService.list(),
    enabled: open && isAuthenticated,
    staleTime: 60_000,
  });
  const addrs = addressesQuery.data ?? [];
  const defaultAddr = addrs.find((a) => a.isDefault) ?? addrs[0] ?? null;
  const addressLine = defaultAddr ? formatAddressDetail(defaultAddr) : '';

  const feeQuery = useQuery({
    queryKey: ['store-selector', 'fees', addressLine],
    queryFn: ({ signal }) => shippingService.getStoreOptions(addressLine, { signal }),
    enabled: open && addressLine.trim().length > 0,
    staleTime: 60_000,
  });
  const feeByStore = useMemo(() => {
    const m = new Map<number, { fee: number | null; km: number | null }>();
    for (const o of feeQuery.data ?? []) {
      m.set(o.storeId, { fee: o.shippingFeeVnd ?? null, km: o.distanceKilometers ?? null });
    }
    return m;
  }, [feeQuery.data]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[12vh]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-lg bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="m-0 flex items-center gap-2 text-body font-semibold text-text-primary">
            <StoreIcon className="h-4 w-4 text-danger" /> Chọn cửa hàng gần bạn
          </p>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded p-1 text-text-secondary hover:bg-background">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-auto p-2">
          {storesQuery.isLoading ? (
            <p className="px-3 py-6 text-center text-body text-text-secondary">Đang tải cửa hàng…</p>
          ) : stores.length === 0 ? (
            <p className="px-3 py-6 text-center text-body text-text-secondary">
              {variantIds.length > 0 || productIds.length > 0
                ? 'Không có cửa hàng nào còn đủ hàng cho sản phẩm trong giỏ.'
                : 'Chưa có cửa hàng nào.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {stores.map((s) => {
                const fee = feeByStore.get(s.id);
                const selected = s.id === selectedStoreId;
                const loc = [s.addressLine, s.city].filter((x) => x && x.trim()).join(', ') || s.code;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(s.id);
                        onClose();
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left transition-colors',
                        selected ? 'border-danger bg-danger/5' : 'border-border hover:bg-background'
                      )}
                    >
                      <span className="flex min-w-0 items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" />
                        <span className="min-w-0">
                          <span className="block truncate text-body font-medium text-text-primary">
                            {s.name}
                            {s.isDefault ? ' (mặc định)' : ''}
                          </span>
                          <span className="block truncate text-caption text-text-secondary">
                            {loc}
                            {fee?.km != null ? ` · ${fee.km} km` : ''}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-shrink-0 items-center gap-2">
                        {fee?.fee != null && (
                          <span className="text-body font-medium text-text-primary">{formatPrice(fee.fee)}</span>
                        )}
                        {selected && <Check className="h-4 w-4 text-danger" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {!isAuthenticated && (
          <p className="border-t border-border px-4 py-2 text-caption text-text-secondary">
            Đăng nhập và thêm địa chỉ để xem phí vận chuyển theo từng cửa hàng.
          </p>
        )}
      </div>
    </div>
  );
}
