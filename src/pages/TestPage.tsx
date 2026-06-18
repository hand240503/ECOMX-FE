import { useEffect, useState } from 'react';
import { Fan, Power } from 'lucide-react';

/** 7 sắc cầu vồng neon — càng bão hoà càng chói mắt. */
const RAINBOW = ['#FF0000', '#FF8000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'];

type Speed = '1' | '2' | '3' | 'off';

/** Quạt: 1 nhanh nhất → 3 chậm nhất → off (tắt, dừng đổi màu). */
const INTERVAL_MS: Record<Speed, number | null> = {
  '1': 80,
  '2': 280,
  '3': 700,
  off: null,
};
const SPIN_SEC: Record<Speed, number> = { '1': 0.2, '2': 0.6, '3': 1.4, off: 0 };

const SPEED_BUTTONS: { key: Speed; label: string; hint: string }[] = [
  { key: '1', label: '1', hint: 'Nhanh nhất' },
  { key: '2', label: '2', hint: 'Vừa' },
  { key: '3', label: '3', hint: 'Chậm' },
  { key: 'off', label: 'OFF', hint: 'Tắt' },
];

export default function TestPage() {
  const [speed, setSpeed] = useState<Speed>('off');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const ms = INTERVAL_MS[speed];
    if (ms == null) return; // off → dừng đổi màu (đứng ở màu hiện tại)
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % RAINBOW.length);
    }, ms);
    return () => window.clearInterval(id);
  }, [speed]);

  const bg = RAINBOW[idx];
  const running = speed !== 'off';

  return (
    <div
      className="flex min-h-screen w-full flex-col items-center justify-center gap-10 px-4"
      style={{ background: bg, transition: 'none' }}
    >
      {/* Quạt quay */}
      <div className="flex flex-col items-center gap-4">
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full bg-white/85 shadow-[0_0_60px_20px_rgba(255,255,255,0.6)]"
        >
          <Fan
            className={`h-28 w-28 text-slate-900 ${running ? 'animate-spin' : ''}`}
            style={running ? { animationDuration: `${SPIN_SEC[speed]}s`, animationTimingFunction: 'linear' } : undefined}
            strokeWidth={1.8}
            aria-hidden
          />
        </div>
        <p
          className="rounded-full bg-black/55 px-4 py-1.5 text-lg font-extrabold tracking-wide text-white"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,.6)' }}
        >
          {speed === 'off' ? 'Quạt: TẮT' : `Tốc độ: ${speed}`}
        </p>
      </div>

      {/* Bảng điều khiển — 4 nút như remote quạt */}
      <div className="flex items-center gap-4 rounded-3xl bg-black/35 p-5 backdrop-blur-sm">
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
                'flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 font-black transition-all',
                'focus:outline-none active:scale-95',
                active
                  ? isOff
                    ? 'border-white bg-red-600 text-white shadow-[0_0_24px_6px_rgba(220,38,38,0.8)]'
                    : 'border-white bg-white text-slate-900 shadow-[0_0_24px_8px_rgba(255,255,255,0.85)] scale-110'
                  : 'border-white/70 bg-white/15 text-white hover:bg-white/30',
              ].join(' ')}
            >
              {isOff ? <Power className="h-7 w-7" aria-hidden /> : <span className="text-3xl leading-none">{b.label}</span>}
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-90">{b.hint}</span>
            </button>
          );
        })}
      </div>

      <p
        className="text-center text-sm font-bold text-white"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,.7)' }}
      >
        Nền đổi 7 sắc cầu vồng — số càng nhỏ đổi càng nhanh, OFF để dừng.
      </p>
    </div>
  );
}
