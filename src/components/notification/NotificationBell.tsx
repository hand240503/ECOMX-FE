import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2, PackageCheck, RotateCcw, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../api/services';
import { useAuth } from '../../app/auth/AuthProvider';
import { cn } from '../../lib/cn';
import type { NotificationDto } from '../../api/types/notification.types';

const POLL_MS = 30_000;

function TypeIcon({ type }: { type: string | null }) {
  if (type === 'RETURN_REFUND') return <RotateCcw className="h-4 w-4 text-warning" aria-hidden />;
  if (type === 'PAYMENT') return <Wallet className="h-4 w-4 text-success" aria-hidden />;
  return <PackageCheck className="h-4 w-4 text-primary" aria-hidden />;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} giờ trước`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Poll số chưa đọc (chỉ khi đã đăng nhập).
  const unreadQuery = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationService.unreadCount(),
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? POLL_MS : false,
    refetchIntervalInBackground: false,
  });
  const unread = unreadQuery.data ?? 0;

  // Danh sách chỉ tải khi mở dropdown.
  const listQuery = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationService.list(20),
    enabled: isAuthenticated && open,
    staleTime: 10_000,
  });

  // Đóng khi click ra ngoài / nhấn Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    void queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
  };

  const onItemClick = async (n: NotificationDto) => {
    try {
      if (!n.isRead) await notificationService.markRead(n.id);
    } catch {
      // bỏ qua, vẫn điều hướng
    }
    refresh();
    setOpen(false);
    navigate(n.orderId ? `/orders/${n.orderId}` : '/orders');
  };

  const onMarkAll = async () => {
    try {
      await notificationService.markAllRead();
    } finally {
      refresh();
    }
  };

  const items = listQuery.data ?? [];

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 outline-none transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
        aria-label="Thông báo"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-[200] mt-2 w-[340px] max-w-[90vw] overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <p className="m-0 text-body font-semibold text-text-primary">Thông báo</p>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void onMarkAll()}
                className="inline-flex items-center gap-1 text-caption font-medium text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-caption text-text-secondary">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Đang tải...
              </div>
            ) : items.length === 0 ? (
              <p className="m-0 px-4 py-8 text-center text-caption text-text-secondary">
                Bạn chưa có thông báo nào.
              </p>
            ) : (
              <ul className="m-0 list-none p-0">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void onItemClick(n)}
                      className={cn(
                        'flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-background',
                        !n.isRead && 'bg-primary/5'
                      )}
                    >
                      <span className="mt-0.5 shrink-0">
                        <TypeIcon type={n.type} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              'truncate text-body',
                              n.isRead ? 'font-medium text-text-secondary' : 'font-semibold text-text-primary'
                            )}
                          >
                            {n.title}
                          </span>
                          {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
                        </span>
                        {n.message && (
                          <span className="mt-0.5 block line-clamp-2 text-caption text-text-secondary">
                            {n.message}
                          </span>
                        )}
                        <span className="mt-1 block text-caption text-text-disabled">
                          {formatWhen(n.createdDate)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/orders');
            }}
            className="block w-full border-t border-border px-4 py-2.5 text-center text-caption font-medium text-primary hover:bg-background"
          >
            Xem tất cả đơn hàng
          </button>
        </div>
      )}
    </div>
  );
}
