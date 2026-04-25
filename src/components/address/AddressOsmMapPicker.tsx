import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../../lib/cn';

const ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const VN_CENTER: LatLngExpression = [16.0, 107.0];
const VN_ZOOM = 5.5;

type Props = {
  className?: string;
  mapHeightClass?: string;
  center?: LatLngExpression;
  initialZoom?: number;
  /** Kết quả geocode; null = chưa có. */
  marker: { lat: number; lng: number } | null;
  /** Chỉ xem, không gán điểm từ map. */
  disabled?: boolean;
};

function FlyTo({ marker }: { marker: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!marker) {
      return;
    }
    map.flyTo([marker.lat, marker.lng], 16, { duration: 0.4 });
  }, [map, marker?.lat, marker?.lng, marker]);
  return null;
}

/** Bản đồ OSM — hiển thị marker sau geocode; không tương tác gán vị trí. */
export default function AddressOsmMapPicker({
  className,
  mapHeightClass = 'h-[min(220px,45vh)]',
  center = VN_CENTER,
  initialZoom = VN_ZOOM,
  marker,
  disabled = false
}: Props) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-sm border border-border bg-surface',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
    >
      <div className={cn('w-full', mapHeightClass, 'min-h-[180px]')}>
        <MapContainer className="z-0 h-full w-full" center={center} zoom={initialZoom} scrollWheelZoom>
          <TileLayer attribution={ATTRIB} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FlyTo marker={marker} />
          {marker != null && (
            <CircleMarker
              center={[marker.lat, marker.lng]}
              pathOptions={{ color: '#1A94FF', fillColor: '#1A94FF', fillOpacity: 0.5 }}
              radius={8}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export { VN_CENTER, VN_ZOOM };
