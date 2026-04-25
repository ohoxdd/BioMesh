import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default leaflet marker icon in react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function P2PMap({ peersData }) {
  // Center map on the first peer, or Barcelona by default
  const defaultCenter = [41.3879, 2.1699];
  const center = peersData.length > 0 && peersData[0].location ? peersData[0].location : defaultCenter;
  
  // Also support lat/lng directly if location array isn't provided
  const getPosition = (peer) => {
      if (peer.location && Array.isArray(peer.location) && peer.location.length === 2) return peer.location;
      if (peer.lat && peer.lng) return [peer.lat, peer.lng];
      return null;
  }

  return (
    <div className="map-container">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <ChangeView center={center} />
        {peersData.map((peer, idx) => {
          const position = getPosition(peer);
          if (!position) return null;
          return (
            <Marker key={idx} position={position}>
              <Popup>
                <div style={{ color: '#0f172a' }}>
                  <strong>{peer.peerId || 'Arduino Edge AI'}</strong><br/>
                  Temp: {peer.temperature || peer.temp}°C<br/>
                  Hum: {peer.humidity || peer.hum}%
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
