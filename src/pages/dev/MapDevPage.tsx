import { useCallback, useEffect, useId, useState, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import MainHeader from '../../layout/header/MainHeader';
import MainFooter from '../../layout/footer/MainFooter';
import { haversineMeters } from '../../lib/geo/haversineMeters';
import { nominatimSearch } from '../../lib/geo/nominatimSearch';
import { authInputClass } from '../../lib/authFormClasses';
import { cn } from '../../lib/cn';

const MapDevMapInner = lazy(() => import('./MapDevMapInner'));

type LngLat = { lat: number; lng: number };

type OsrmOk = { distanceM: number; durationS: number; latlngs: [number, number][] };

function formatKm(m: number) {
  if (m < 1000) return `${m.toFixed(0)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

function formatDuration(s: number) {
  if (s < 60) return `${Math.round(s)} giây`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h} giờ ${rem} phút` : `${h} giờ`;
}

const NOMINATIM_GAP_MS = 1100;

function osrmBaseUrl() {
  return import.meta.env.DEV ? '/osrm' : 'https://router.project-osrm.org';
}

async function fetchOsrmRoute(a: LngLat, b: LngLat, signal: AbortSignal): Promise<OsrmOk | { error: string }> {
  const path = `route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&steps=false`;
  const url = `${osrmBaseUrl()}/${path}`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    return { error: `OSRM: HTTP ${res.status}` };
  }
  const data = (await res.json()) as {
    code?: string;
    routes?: { distance: number; duration: number; geometry: { type: string; coordinates: [number, number][] } }[];
  };
  if (data.code !== 'Ok' || !data.routes?.[0]) {
    return { error: 'Không tìm thấy tuyến đường (OSRM).' };
  }
  const r0 = data.routes[0];
  const coords = r0.geometry?.coordinates;
  if (!coords?.length) {
    return { error: 'Thiếu dữ liệu geometry từ OSRM.' };
  }
  const latlngs: [number, number][] = coords.map(([lon, lat]) => [lat, lon]);
  return {
    distanceM: r0.distance,
    durationS: r0.duration,
    latlngs
  };
}

export default function MapDevPage() {
  const formId = useId();
  const [placeMode, setPlaceMode] = useState<'a' | 'b'>('a');
  const [pointA, setPointA] = useState<LngLat | null>(null);
  const [pointB, setPointB] = useState<LngLat | null>(null);
  const [addressTextA, setAddressTextA] = useState('');
  const [addressTextB, setAddressTextB] = useState('');
  const [displayNameA, setDisplayNameA] = useState<string | null>(null);
  const [displayNameB, setDisplayNameB] = useState<string | null>(null);
  const [geocodeErrorA, setGeocodeErrorA] = useState<string | null>(null);
  const [geocodeErrorB, setGeocodeErrorB] = useState<string | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [mapRecenterId, setMapRecenterId] = useState(0);
  const [mapRecenterTo, setMapRecenterTo] = useState<'a' | 'b' | 'ab'>('a');
  const [routeLatLngs, setRouteLatLngs] = useState<[number, number][]>([]);
  const [osrm, setOsrm] = useState<OsrmOk | null>(null);
  const [osrmError, setOsrmError] = useState<string | null>(null);
  const [osrmLoading, setOsrmLoading] = useState(false);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [geolocationRequesting, setGeolocationRequesting] = useState(false);
  const autoGeolocationOnce = useRef(false);

  const applyLocationToA = useCallback((lat: number, lng: number) => {
    setPointA({ lat, lng });
    setDisplayNameA('Vị trí hiện tại (Geolocation API)');
    setGeocodeErrorA(null);
    setMapRecenterTo('a');
    setMapRecenterId((n) => n + 1);
  }, []);

  const requestUserLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeolocationError('Trình duyệt không hỗ trợ Geolocation API.');
      return;
    }
    setGeolocationError(null);
    setGeolocationRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLocationToA(pos.coords.latitude, pos.coords.longitude);
        setGeolocationError(null);
        setGeolocationRequesting(false);
      },
      (err) => {
        setGeolocationRequesting(false);
        const code = (err as GeolocationPositionError).code;
        const msg =
          code === 1
            ? 'Bạn từ chối cấp quyền vị trí hoặc trình duyệt chặn.'
            : code === 2
              ? 'Không thể lấy vị trí (không có tín hiệu).'
              : 'Hết thời gian chờ lấy vị trí.';
        setGeolocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  }, [applyLocationToA]);

  /** Tự động một lần khi mở trang (chặn lặp khi React StrictMode chạy effect 2 lần ở dev). */
  useEffect(() => {
    if (autoGeolocationOnce.current) return;
    autoGeolocationOnce.current = true;
    requestUserLocation();
  }, [requestUserLocation]);

  const onMapClick = useCallback(
    (p: LngLat) => {
      if (placeMode === 'a') {
        setPointA(p);
        setDisplayNameA(null);
        setGeocodeErrorA(null);
      } else {
        setPointB(p);
        setDisplayNameB(null);
        setGeocodeErrorB(null);
      }
    },
    [placeMode]
  );

  const onGeocodeA = useCallback(() => {
    setGeocodeErrorA(null);
    setGeocodeLoading(true);
    nominatimSearch(addressTextA)
      .then((r) => {
        if ('error' in r) {
          setGeocodeErrorA(r.error);
        } else {
          setPointA({ lat: r.lat, lng: r.lng });
          setDisplayNameA(r.displayName);
          setMapRecenterTo('a');
          setMapRecenterId((n) => n + 1);
        }
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return;
        setGeocodeErrorA(e instanceof Error ? e.message : 'Lỗi tìm địa chỉ.');
      })
      .finally(() => {
        setGeocodeLoading(false);
      });
  }, [addressTextA]);

  const onGeocodeB = useCallback(() => {
    setGeocodeErrorB(null);
    setGeocodeLoading(true);
    nominatimSearch(addressTextB)
      .then((r) => {
        if ('error' in r) {
          setGeocodeErrorB(r.error);
        } else {
          setPointB({ lat: r.lat, lng: r.lng });
          setDisplayNameB(r.displayName);
          setMapRecenterTo('b');
          setMapRecenterId((n) => n + 1);
        }
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return;
        setGeocodeErrorB(e instanceof Error ? e.message : 'Lỗi tìm địa chỉ.');
      })
      .finally(() => {
        setGeocodeLoading(false);
      });
  }, [addressTextB]);

  const onGeocodeBoth = useCallback(async () => {
    setGeocodeErrorA(null);
    setGeocodeErrorB(null);
    setGeocodeLoading(true);
    const hasA = addressTextA.trim() !== '';
    const hasB = addressTextB.trim() !== '';
    if (!hasA && !hasB) {
      setGeocodeErrorA('Nhập ít nhất một địa chỉ.');
      setGeocodeLoading(false);
      return;
    }
    try {
      if (hasA) {
        const rA = await nominatimSearch(addressTextA);
        if ('error' in rA) {
          setGeocodeErrorA(rA.error);
          return;
        }
        setPointA({ lat: rA.lat, lng: rA.lng });
        setDisplayNameA(rA.displayName);
      }
      if (hasA && hasB) {
        await new Promise((r) => {
          setTimeout(r, NOMINATIM_GAP_MS);
        });
      }
      if (hasB) {
        const rB = await nominatimSearch(addressTextB);
        if ('error' in rB) {
          setGeocodeErrorB(rB.error);
          return;
        }
        setPointB({ lat: rB.lat, lng: rB.lng });
        setDisplayNameB(rB.displayName);
      }
      if (hasA && hasB) {
        setMapRecenterTo('ab');
      } else if (hasA) {
        setMapRecenterTo('a');
      } else {
        setMapRecenterTo('b');
      }
      setMapRecenterId((n) => n + 1);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi tìm địa chỉ.';
      setGeocodeErrorA(msg);
      setGeocodeErrorB(msg);
    } finally {
      setGeocodeLoading(false);
    }
  }, [addressTextA, addressTextB]);

  useEffect(() => {
    if (!pointA || !pointB) {
      setRouteLatLngs([]);
      setOsrm(null);
      setOsrmError(null);
      return;
    }

    const ac = new AbortController();
    setOsrmLoading(true);
    setOsrmError(null);
    setOsrm(null);
    setRouteLatLngs([]);

    fetchOsrmRoute(pointA, pointB, ac.signal)
      .then((r) => {
        if ('error' in r) {
          setOsrmError(r.error);
        } else {
          setOsrm(r);
          setRouteLatLngs(r.latlngs);
        }
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return;
        setOsrmError(
          e instanceof Error ? e.message : 'Lỗi mạng hoặc CORS. Chạy `npm run dev` để dùng proxy /osrm.'
        );
      })
      .finally(() => {
        setOsrmLoading(false);
      });

    return () => ac.abort();
  }, [pointA, pointB]);

  const straightM =
    pointA && pointB ? haversineMeters(pointA.lat, pointA.lng, pointB.lat, pointB.lng) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <MainHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 tablet:px-6">
          <div className="mb-4">
            <Link
              to="/"
              className="text-body text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              ← Về trang chủ
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-text-primary">Map dev (OSM + OSRM)</h1>
            <p className="mt-1 text-body text-text-secondary">
              Trang sẽ hỏi quyền vị trí để tự gán <strong>điểm A</strong> (cần HTTPS khi production). Nhập địa chỉ
              (Nominatim) hoặc click bản đồ. Tuyến đường theo OSRM. Proxy{' '}
              <code className="rounded-sm bg-gray-100 px-1 py-0.5 text-sm text-text-primary">/osrm</code> và{' '}
              <code className="rounded-sm bg-gray-100 px-1 py-0.5 text-sm text-text-primary">/nominatim</code>{' '}
              khi chạy <code className="rounded-sm bg-gray-100 px-1 py-0.5 text-sm text-text-primary">npm run dev</code>.
            </p>
          </div>

          <div className="mb-4 space-y-3 rounded-sm border border-border bg-surface p-4 text-body">
            {geolocationRequesting && (
              <p className="text-caption text-text-secondary">Đang lấy vị trí của bạn (điểm A)…</p>
            )}
            {geolocationError && <p className="text-caption text-warning">{geolocationError}</p>}
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-caption font-semibold text-text-primary" htmlFor={`${formId}-addr-a`}>
                  Địa chỉ A
                </label>
                <button
                  type="button"
                  disabled={geolocationRequesting}
                  onClick={requestUserLocation}
                  className="text-caption font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                >
                  Dùng vị trí hiện tại cho A
                </button>
              </div>
              <div className="flex flex-col gap-2 min-[500px]:flex-row min-[500px]:items-stretch">
                <input
                  id={`${formId}-addr-a`}
                  type="text"
                  value={addressTextA}
                  onChange={(e) => {
                    setAddressTextA(e.target.value);
                    setGeocodeErrorA(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onGeocodeA();
                    }
                  }}
                  placeholder="Ví dụ: 35 Lê Lợi, Quận 1, TP. Hồ Chí Minh"
                  className={authInputClass()}
                  autoComplete="street-address"
                />
                <button
                  type="button"
                  disabled={geocodeLoading}
                  className="shrink-0 rounded-sm border border-border bg-surface px-3 py-2.5 text-sm font-medium text-primary ring-1 ring-inset ring-border hover:bg-primary-light/30 disabled:opacity-50"
                  onClick={onGeocodeA}
                >
                  Tìm A
                </button>
              </div>
              {geocodeErrorA && <p className="mt-1 text-caption text-warning">{geocodeErrorA}</p>}
            </div>
            <div>
              <label className="mb-1 block text-caption font-semibold text-text-primary" htmlFor={`${formId}-addr-b`}>
                Địa chỉ B
              </label>
              <div className="flex flex-col gap-2 min-[500px]:flex-row min-[500px]:items-stretch">
                <input
                  id={`${formId}-addr-b`}
                  type="text"
                  value={addressTextB}
                  onChange={(e) => {
                    setAddressTextB(e.target.value);
                    setGeocodeErrorB(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onGeocodeB();
                    }
                  }}
                  placeholder="Ví dụ: Đinh Tiên Hoàng, Quận 1, TP. Hồ Chí Minh"
                  className={authInputClass()}
                  autoComplete="street-address"
                />
                <button
                  type="button"
                  disabled={geocodeLoading}
                  className="shrink-0 rounded-sm border border-border bg-surface px-3 py-2.5 text-sm font-medium text-primary ring-1 ring-inset ring-border hover:bg-primary-light/30 disabled:opacity-50"
                  onClick={onGeocodeB}
                >
                  Tìm B
                </button>
              </div>
              {geocodeErrorB && <p className="mt-1 text-caption text-warning">{geocodeErrorB}</p>}
            </div>
            <button
              type="button"
              disabled={geocodeLoading}
              className="w-full rounded-sm bg-primary px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              onClick={onGeocodeBoth}
            >
              Tìm cả A và B (cách ~1s giữa 2 lần gọi)
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-sm border border-border bg-surface p-4 text-body">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Click bản đồ sẽ đặt:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={cn(
                    'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                    placeMode === 'a'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-primary ring-1 ring-border hover:bg-surface'
                  )}
                  onClick={() => setPlaceMode('a')}
                >
                  Điểm A (xanh)
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                    placeMode === 'b'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-text-primary ring-1 ring-border hover:bg-surface'
                  )}
                  onClick={() => setPlaceMode('b')}
                >
                  Điểm B (đỏ)
                </button>
              </div>
            </div>
            <div className="h-4 w-px bg-border" aria-hidden />
            <button
              type="button"
              className="rounded-sm px-2 py-1 text-sm text-text-secondary underline hover:text-text-primary"
              onClick={() => {
                setPointA(null);
                setPointB(null);
                setAddressTextA('');
                setAddressTextB('');
                setDisplayNameA(null);
                setDisplayNameB(null);
                setGeocodeErrorA(null);
                setGeocodeErrorB(null);
              }}
            >
              Xóa cả A và B
            </button>
          </div>

          <div className="grid gap-4 desktop:grid-cols-[1fr_280px]">
            <div className="min-h-[420px] overflow-hidden rounded-sm border border-border bg-surface">
              <Suspense
                fallback={
                  <div className="flex h-[420px] items-center justify-center text-text-secondary">
                    Đang tải bản đồ…
                  </div>
                }
              >
                <MapDevMapInner
                  pointA={pointA}
                  pointB={pointB}
                  routeLatLngs={routeLatLngs}
                  onMapClick={onMapClick}
                  mapRecenterId={mapRecenterId}
                  mapRecenterTo={mapRecenterTo}
                />
              </Suspense>
            </div>

            <div className="space-y-3 text-body">
              <section className="rounded-sm border border-border bg-surface p-3" aria-labelledby={`${formId}-coords`}>
                <h2 id={`${formId}-coords`} className="mb-2 text-sm font-semibold text-text-primary">
                  Tọa độ
                </h2>
                <p className="text-xs text-text-secondary">A: {pointA ? `${pointA.lat.toFixed(5)}, ${pointA.lng.toFixed(5)}` : '—'}</p>
                {displayNameA && (
                  <p className="mt-1 line-clamp-3 text-caption text-text-secondary" title={displayNameA}>
                    {displayNameA}
                  </p>
                )}
                <p className="mt-2 text-xs text-text-secondary">B: {pointB ? `${pointB.lat.toFixed(5)}, ${pointB.lng.toFixed(5)}` : '—'}</p>
                {displayNameB && (
                  <p className="mt-1 line-clamp-3 text-caption text-text-secondary" title={displayNameB}>
                    {displayNameB}
                  </p>
                )}
              </section>
              <section className="rounded-sm border border-border bg-surface p-3" aria-labelledby={`${formId}-dist`}>
                <h2 id={`${formId}-dist`} className="mb-2 text-sm font-semibold text-text-primary">
                  Khoảng cách
                </h2>
                {straightM != null && (
                  <p className="text-sm">
                    <span className="text-text-secondary">Đường chim bay: </span>
                    {formatKm(straightM)}
                  </p>
                )}
                {osrmLoading && <p className="text-sm text-primary">Đang tính tuyến OSRM…</p>}
                {osrm && !osrmLoading && (
                  <>
                    <p className="text-sm">
                      <span className="text-text-secondary">Theo đường (OSRM): </span>
                      {formatKm(osrm.distanceM)}
                    </p>
                    <p className="text-sm text-text-secondary">Ước thời gian lái: {formatDuration(osrm.durationS)}</p>
                  </>
                )}
                {osrmError && !osrmLoading && (
                  <p className="text-sm text-warning">{osrmError}</p>
                )}
                {!import.meta.env.DEV && !osrmLoading && !osrm && !osrmError && pointA && pointB && (
                  <p className="text-xs text-text-secondary">
                    Build production: OSRM / Nominatim có thể bị CORS. Dùng proxy trên server hoặc gọi từ backend.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
      <MainFooter />
    </div>
  );
}
