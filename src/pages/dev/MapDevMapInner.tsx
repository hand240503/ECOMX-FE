import { useCallback, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER: LatLngExpression = [10.8231, 106.6297];
const DEFAULT_ZOOM = 12;

const tileAttribution =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

type LngLat = { lat: number; lng: number };

function MapClickHandler({ onMapClick }: { onMapClick: (p: LngLat) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    }
  });
  return null;
}

const FLY_ZOOM = 16;

/** Bay tới vị trí vừa tìm (Nominatim); không gọi khi chỉ click map. */
function MapViewOnGeocode({
  pointA,
  pointB,
  mapRecenterId,
  mapRecenterTo
}: {
  pointA: LngLat | null;
  pointB: LngLat | null;
  mapRecenterId: number;
  mapRecenterTo: 'a' | 'b' | 'ab';
}) {
  const map = useMap();
  const lastId = useRef(0);
  useEffect(() => {
    if (mapRecenterId === 0 || mapRecenterId === lastId.current) return;
    lastId.current = mapRecenterId;

    if (mapRecenterTo === 'a' && pointA) {
      map.flyTo([pointA.lat, pointA.lng], FLY_ZOOM, { duration: 0.45 });
      return;
    }
    if (mapRecenterTo === 'b' && pointB) {
      map.flyTo([pointB.lat, pointB.lng], FLY_ZOOM, { duration: 0.45 });
      return;
    }
    if (mapRecenterTo === 'ab') {
      if (pointA && pointB) {
        const b = L.latLngBounds(
          L.latLng(pointA.lat, pointA.lng),
          L.latLng(pointB.lat, pointB.lng)
        );
        map.flyToBounds(b, { padding: [40, 40], maxZoom: FLY_ZOOM, duration: 0.5 });
      } else if (pointA) {
        map.flyTo([pointA.lat, pointA.lng], FLY_ZOOM, { duration: 0.45 });
      } else if (pointB) {
        map.flyTo([pointB.lat, pointB.lng], FLY_ZOOM, { duration: 0.45 });
      }
    }
  }, [mapRecenterId, mapRecenterTo, pointA, pointB, map]);
  return null;
}

type Props = {
  pointA: LngLat | null;
  pointB: LngLat | null;
  routeLatLngs: [number, number][];
  onMapClick: (p: LngLat) => void;
  mapRecenterId: number;
  mapRecenterTo: 'a' | 'b' | 'ab';
};

export default function MapDevMapInner({
  pointA,
  pointB,
  routeLatLngs,
  onMapClick,
  mapRecenterId,
  mapRecenterTo
}: Props) {
  const handleMapClick = useCallback(
    (latlng: { lat: number; lng: number }) => {
      onMapClick({ lat: latlng.lat, lng: latlng.lng });
    },
    [onMapClick]
  );

  const lineStraight = useMemo((): [number, number][] | null => {
    if (!pointA || !pointB) return null;
    return [
      [pointA.lat, pointA.lng],
      [pointB.lat, pointB.lng]
    ];
  }, [pointA, pointB]);

  return (
    <MapContainer
      className="z-0 h-full min-h-[360px] w-full rounded-sm"
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
    >
      <TileLayer attribution={tileAttribution} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapViewOnGeocode
        pointA={pointA}
        pointB={pointB}
        mapRecenterId={mapRecenterId}
        mapRecenterTo={mapRecenterTo}
      />
      <MapClickHandler onMapClick={handleMapClick} />
      {pointA != null && (
        <CircleMarker
          center={[pointA.lat, pointA.lng]}
          pathOptions={{ color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.85 }}
          radius={9}
        />
      )}
      {pointB != null && (
        <CircleMarker
          center={[pointB.lat, pointB.lng]}
          pathOptions={{ color: '#b91c1c', fillColor: '#ef4444', fillOpacity: 0.85 }}
          radius={9}
        />
      )}
      {lineStraight != null && pointA && pointB && routeLatLngs.length === 0 && (
        <Polyline
          pathOptions={{ color: '#64748b', weight: 2, dashArray: '6 6' }}
          positions={lineStraight}
        />
      )}
      {routeLatLngs.length > 0 && (
        <Polyline pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.9 }} positions={routeLatLngs} />
      )}
    </MapContainer>
  );
}

export { DEFAULT_CENTER, DEFAULT_ZOOM };
