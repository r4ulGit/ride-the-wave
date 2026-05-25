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

    // Create Leaflet map - Disable default wheel zoom so we can override it with custom smooth gliding animations
    const map = L.map(container, {
      zoomControl:         true,
      scrollWheelZoom:     false, // Disabled to prevent default jerky/instant scroll jumps
      zoomSnap:            1,     // Snaps to integer zoom levels
      zoomDelta:           1,     // Each zoom step is exactly 1 level (same as buttons)
      zoomAnimation:       true,  // Smooth transitions
      fadeAnimation:       true,
      markerZoomAnimation: true,
      dragging:            true,  // Allow dragging on the combined map
      doubleClickZoom:     true,
      touchZoom:           true,
      keyboard:            false,
      attributionControl:  false,
    });

    // Intercept scroll wheel for ultra-smooth zoom animations centered at the cursor
    const handleWheel = (e) => {
      e.preventDefault(); // Prevent main webpage scrolling
      
      const now = Date.now();
      // Debounce: Allow 350ms for the smooth animation glide to settle before receiving the next tick
      if (map._lastWheelTime && (now - map._lastWheelTime < 350)) {
        return;
      }
      map._lastWheelTime = now;
      
      const mouseLatLng = map.mouseEventToLatLng(e);
      const currentZoom = map.getZoom();
      const zoomChange = e.deltaY < 0 ? 1 : -1;
      
      const minZoom = map.getMinZoom() || 1;
      const maxZoom = map.getMaxZoom() || 19;
      const targetZoom = Math.min(Math.max(currentZoom + zoomChange, minZoom), maxZoom);
      
      if (targetZoom !== currentZoom) {
        // High-premium smooth animation glide centered directly where the cursor is pointing
        map.setView(mouseLatLng, targetZoom, {
          animate: true,
          duration: 0.35, // Glide duration in seconds
          easeLinearity: 0.25
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    // CartoDB Positron (Light) tiles
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19 }
    ).addTo(map);

    // Find the starting point coordinate dynamically from the first chronological activity (last in the array)
    let startCoords = null;
    for (let i = polylines.length - 1; i >= 0; i--) {
      const positions = decodePolyline(polylines[i]);
      if (positions && positions.length > 0) {
        startCoords = positions[0]; // First coordinate of the earliest activity
        break;
      }
    }

    // Render the starting point marker in red if a coordinate is resolved
    if (startCoords) {
      // Glow ring
      L.circleMarker(startCoords, {
        radius: 14,
        fillColor: '#ef4444',
        color: '#ef4444',
        weight: 1,
        fillOpacity: 0.15,
        interactive: false
      }).addTo(map);

      // Core red dot marker
      L.circleMarker(startCoords, {
        radius: 7,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1.0
      }).addTo(map).bindTooltip("Starting Point", { direction: 'top' });
    }

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
        container.removeEventListener('wheel', handleWheel);
        map.remove();
      };
    } else {
      container.removeEventListener('wheel', handleWheel);
      map.remove();
    }
  }, [polylines, color]);

  if (!polylines || polylines.length === 0) {
    return null;
  }

  return (
    <div className="combined-map-wrapper glass-card animate-in" style={{ display: 'flex', flexDirection: 'column', marginBottom: '2.5rem' }}>
      <div className="card-body" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="card-title">Progreso actual</div>
      </div>
      <div className="card-map" style={{ height: '400px', width: '100%', position: 'relative' }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
      </div>
    </div>
  );
}
