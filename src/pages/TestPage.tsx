import { useEffect, useState } from 'react';
import { Power } from 'lucide-react';

/** 7 sắc cầu vồng neon — càng bão hoà càng chói mắt. */
const RAINBOW = ['#FF0000', '#FF8000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'];

/** Ảnh mặt — đặt file tại ecomx-fe/public/face.png (đã tách nền trong suốt) */
const FACE_SRC = '/face.png';

type Speed = '1' | '2' | '3' | 'off';

/** Quạt: 1 nhanh nhất → 3 chậm nhất → off (tắt, dừng xoay + dừng đổi màu). */
const INTERVAL_MS: Record<Speed, number | null> = {
  '1': 80,
  '2': 280,
  '3': 700,
  off: null,
};
const SPIN_SEC: Record<Speed, number> = { '1': 0.35, '2': 1, '3': 2.4, off: 0 };

const SPEED_BUTTONS: { key: Speed; label: string; hint: string }[] = [
  { key: '1', label: '1', hint: 'Nhanh nhất' },
  { key: '2', label: '2', hint: 'Vừa' },
  { key: '3', label: '3', hint: 'Chậm' },
  { key: 'off', label: 'OFF', hint: 'Tắt' },
];

export default function TestPage() {
  const [speed, setSpeed] = useState<Speed>('off');
  const [idx, setIdx] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const ms = INTERVAL_MS[speed];
    if (ms == null) return; // off → dừng đổi màu
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % RAINBOW.length);
    }, ms);
    return () => window.clearInterval(id);
  }, [speed]);

  const bg = RAINBOW[idx];
  const running = speed !== 'off';

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: bg, transition: 'none' }}
    >
      {/* Mặt xoay — to hết cỡ, căn giữa */}
      <div className="absolute inset-0 flex items-center justify-center">
        {imgError ? (
          <div className="max-w-md rounded-2xl bg-black/55 px-6 py-5 text-center text-white">
            <p className="m-0 text-lg font-extrabold">Chưa thấy ảnh 🙃</p>
            <p className="m-0 mt-2 text-sm font-medium leading-relaxed">
              Lưu ảnh mặt của bạn vào:
              <br />
              <code className="rounded bg-white/20 px-1.5 py-0.5">ecomx-fe/public/myface.png</code>
              <br />
              rồi tải lại trang.
            </p>
          </div>
        ) : (
          <img
            src={FACE_SRC}
            alt="Mặt"
            onError={() => setImgError(true)}
            className={running ? 'animate-spin' : ''}
            style={{
              width: 'min(96vw, 96vh)',
              height: 'min(96vw, 96vh)',
              objectFit: 'contain',
              animationDuration: running ? `${SPIN_SEC[speed]}s` : undefined,
              animationTimingFunction: 'linear',
              filter: 'drop-shadow(0 0 24px rgba(0,0,0,0.35))',
            }}
            draggable={false}
          />
        )}
      </div>

      {/* Bảng điều khiển — 4 nút như remote quạt, nổi trên cùng */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-3xl bg-black/40 p-4 backdrop-blur-sm">
        {SPEED_BUTTONS.map((b) => {
          const active = speed === b.key;
          const isOff = b.key === 'off';
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => setSpeed(b.key)}
              aria-pressed={active}
              className={[
                'flex h-[68px] w-[68px] flex-col items-center justify-center gap-0.5 rounded-2xl border-2 font-black transition-all',
                'focus:outline-none active:scale-95',
                active
                  ? isOff
                    ? 'border-white bg-red-600 text-white shadow-[0_0_22px_6px_rgba(220,38,38,0.85)]'
                    : 'scale-110 border-white bg-white text-slate-900 shadow-[0_0_22px_8px_rgba(255,255,255,0.9)]'
                  : 'border-white/70 bg-white/15 text-white hover:bg-white/30',
              ].join(' ')}
            >
              {isOff ? <Power className="h-6 w-6" aria-hidden /> : <span className="text-2xl leading-none">{b.label}</span>}
              <span className="text-[9px] font-bold uppercase tracking-wide opacity-90">{b.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
