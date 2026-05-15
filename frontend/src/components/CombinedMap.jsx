import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { decodePolyline } from '../utils/helpers';

export function CombinedMap({ polylines, color }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !polylines || polylines.length === 0) return;

    // We must ensure the container is completely empty before initializing
    container.innerHTML = '';

    // Create Leaflet map
    const map = L.map(container, {
      zoomControl:       false,
      scrollWheelZoom:   false,
      dragging:          true, // Allow dragging on the combined map
      doubleClickZoom:   true,
      touchZoom:         true,
      keyboard:          false,
      attributionControl: false,
    });

    // CartoDB Dark Matter tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map);

    let allPositions = [];

    // Draw every polyline
    polylines.forEach(encoded => {
      const positions = decodePolyline(encoded);
      if (positions.length < 2) return;

      allPositions = allPositions.concat(positions);

      // Glow + main route line for each activity
      // Using lower opacity for the combined map to create a "heatmap" effect
      L.polyline(positions, { color, weight: 6, opacity: 0.1, lineCap: 'round', lineJoin: 'round' }).addTo(map);
      L.polyline(positions, { color, weight: 2, opacity: 0.4, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    });

    if (allPositions.length > 0) {
      // Let the browser paint the container first, then fit bounds
      const rafId = requestAnimationFrame(() => {
        map.invalidateSize();
        map.fitBounds(L.latLngBounds(allPositions), { padding: [20, 20] });
      });

      return () => {
        cancelAnimationFrame(rafId);
        map.remove();
      };
    } else {
      map.remove();
    }
  }, [polylines, color]);

  if (!polylines || polylines.length === 0) {
    return null;
  }

  return (
    <div className="combined-map-wrapper glass-card animate-in" style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column' }}>
      <div className="card-body" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="card-title">Global Heatmap</div>
        <div className="card-stat-label">All your routes combined into a single map</div>
      </div>
      <div className="card-map" style={{ height: '400px', width: '100%', position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      </div>
    </div>
  );
}
