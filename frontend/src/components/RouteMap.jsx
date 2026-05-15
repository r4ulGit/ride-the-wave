import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { decodePolyline } from '../utils/helpers';
import { getSport } from '../config';

export function RouteMap({ polyline, color }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !polyline) return;

    // We must ensure the container is completely empty before initializing
    // This is crucial for React 18 StrictMode (which unmounts/remounts effects)
    container.innerHTML = '';

    const positions = decodePolyline(polyline);
    if (positions.length < 2) return;

    // Create Leaflet map
    const map = L.map(container, {
      zoomControl:       false,
      scrollWheelZoom:   false,
      dragging:          false,
      doubleClickZoom:   false,
      touchZoom:         false,
      keyboard:          false,
      attributionControl: false,
    });

    // CartoDB Dark Matter tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map);

    // Glow + main route line
    L.polyline(positions, { color, weight: 8,   opacity: 0.18, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    L.polyline(positions, { color, weight: 3,   opacity: 1.0,  lineCap: 'round', lineJoin: 'round' }).addTo(map);

    // Let the browser paint the container first, then fit bounds
    const rafId = requestAnimationFrame(() => {
      map.invalidateSize();
      map.fitBounds(L.latLngBounds(positions), { padding: [20, 20] });
    });

    // Cleanup — cancel RAF BEFORE map.remove() so RAF never fires on a dead map
    return () => {
      cancelAnimationFrame(rafId);
      map.remove();
    };
  }, [polyline, color]);

  if (!polyline || decodePolyline(polyline).length < 2) {
    return (
      <div className="card-map-empty">
        {getSport('Default').icon}
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
