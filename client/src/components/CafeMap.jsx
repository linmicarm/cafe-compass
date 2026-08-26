import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Build a custom pin as a divIcon so we can style it with our CSS
// and reflect hover/selected state via class names.
function makePin(state) {
  return L.divIcon({
    className: '', // no default leaflet styling
    html: `<div class="pin ${state}"><span>&#9749;</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -34],
  });
}

// Keeps the map sized correctly. Fixes the grey-tile bug when the map
// lives in a grid/flex panel or is revealed by the mobile toggle.
function SizeFixer({ view }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(t);
  }, [map, view]);
  return null;
}

// Fit the map to the current filtered set whenever it changes.
function FitBounds({ cafes }) {
  const map = useMap();
  useEffect(() => {
    if (!cafes.length) return;
    const bounds = L.latLngBounds(cafes.map((c) => [Number(c.lat), Number(c.lng)]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [map, cafes]);
  return null;
}

// When a café is selected (from a card or a pin), gently pan to it.
// Popup opening is handled by the Marker's own ref below — no Leaflet
// internals are touched, which is what caused the earlier crash.
function PanToSelected({ cafes, selectedId }) {
  const map = useMap();
  useEffect(() => {
    if (selectedId == null) return;
    const cafe = cafes.find((c) => c.id === selectedId);
    if (cafe) map.panTo([Number(cafe.lat), Number(cafe.lng)], { animate: true });
  }, [map, cafes, selectedId]);
  return null;
}

export default function CafeMap({ cafes, hoveredId, selectedId, onHover, onLeave, onSelect, view }) {
  const markerRefs = useRef({});

  // Open the selected marker's popup via the public marker API.
  useEffect(() => {
    const marker = markerRefs.current[selectedId];
    if (marker) marker.openPopup();
  }, [selectedId]);

  const center = cafes.length
    ? [Number(cafes[0].lat), Number(cafes[0].lng)]
    : [39.9612, -82.9988]; // Columbus fallback

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SizeFixer view={view} />
      <FitBounds cafes={cafes} />
      <PanToSelected cafes={cafes} selectedId={selectedId} />

      {cafes.map((cafe) => {
        const state =
          cafe.id === selectedId ? 'is-selected'
          : cafe.id === hoveredId ? 'is-hovered'
          : '';
        return (
          <Marker
            key={cafe.id}
            position={[Number(cafe.lat), Number(cafe.lng)]}
            icon={makePin(state)}
            ref={(m) => { if (m) markerRefs.current[cafe.id] = m; }}
            eventHandlers={{
              mouseover: () => onHover(cafe.id),
              mouseout: onLeave,
              click: () => onSelect(cafe.id),
            }}
          >
            <Popup>
              <strong style={{ fontFamily: 'Fredoka, sans-serif' }}>{cafe.name}</strong>
              <br />
              {cafe.neighborhood}
              <br />
              {Number(cafe.review_count) > 0
                ? `\u2605 ${Number(cafe.avg_rating).toFixed(1)} (${cafe.review_count})`
                : 'No reviews yet'}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
