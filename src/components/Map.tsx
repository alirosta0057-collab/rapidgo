"use client";

import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

// Fix default Leaflet marker icons under Next.js
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export type MapMarker = { lat: number; lng: number; title?: string };

export function LeafletMap({
  center,
  markers,
  height = 400,
  recenter,
}: {
  center: { lat: number; lng: number };
  markers: MapMarker[];
  height?: number;
  recenter?: boolean;
}) {
  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-xl">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {recenter && <Recenter lat={center.lat} lng={center.lng} />}
        {markers.map((m, i) => (
          <Marker key={i} position={[m.lat, m.lng]}>
            {m.title && <Popup>{m.title}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
