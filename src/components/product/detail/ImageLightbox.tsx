import { useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type ImageLightboxProps = {
  open: boolean;
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (next: number) => void;
};

export function ImageLightbox({ open, images, index, onClose, onIndexChange }: ImageLightboxProps) {
  const safeLen = images.length;
  const goPrev = useCallback(() => {
    if (safeLen <= 1) return;
    onIndexChange((index - 1 + safeLen) % safeLen);
  }, [index, onIndexChange, safeLen]);

  const goNext = useCallback(() => {
    if (safeLen <= 1) return;
    onIndexChange((index + 1) % safeLen);
  }, [index, onIndexChange, safeLen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, goPrev, goNext]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || safeLen === 0) return null;

  const src = images[index];

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal
      aria-label="Xem ảnh lớn"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm p-2 text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        aria-label="Đóng"
      >
        <X size={28} />
      </button>

      {safeLen > 1 && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white tablet:left-4"
          aria-label="Ảnh trước"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      <img
        src={src}
        alt=""
        className="max-h-[90vh] max-w-[95vw] object-contain"
      />

      {safeLen > 1 && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white tablet:right-4"
          aria-label="Ảnh sau"
        >
          <ChevronRight size={32} />
        </button>
      )}
    </div>
  );
}
