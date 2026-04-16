import React, { useEffect, useRef, useState } from 'react';
import type { Doctor } from '../../types';
import styles from './DoctorMap.module.scss';

interface Props {
  doctors: Doctor[];
  onSelect: (doctor: Doctor) => void;
  selectedId?: string;
  userLat?: number;
  userLng?: number;
}

const DoctorMap: React.FC<Props> = ({ doctors, onSelect, selectedId, userLat, userLng }) => {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapObj     = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const LRef       = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return; 

    import('leaflet').then(L => {
      LRef.current = L;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const center: [number, number] = userLat && userLng
        ? [userLat, userLng]
        : [19.4326, -99.1332];

      const map = L.map(mapRef.current!, {
        center,
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapObj.current = map;
      setMapReady(true);
    });

    return () => {
      if (mapObj.current) {
        mapObj.current.remove();
        mapObj.current = null;
      }
    };
  }, []); 

  useEffect(() => {
    if (!mapReady || !mapObj.current || !LRef.current) return;
    const L = LRef.current;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (userLat && userLng) {
      const userIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#1a6b5c;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14], iconAnchor: [7, 7], className: '',
      });
      const userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(mapObj.current)
        .bindPopup('<strong>Tu ubicación</strong>');
      markersRef.current.push(userMarker);
    }

    const docMarkers: any[] = [];
    doctors.forEach(doc => {
      if (!doc.locationLat || !doc.locationLng) return;
      const docUser = doc.userId as any;
      const isSelected = doc._id === selectedId;

      const size = isSelected ? 44 : 36;
      const bg   = isSelected ? '#0d3d2e' : '#1a6b5c';
      const icon = L.divIcon({
        html: `<div style="background:${bg};color:white;border-radius:50% 50% 50% 0;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-size:${isSelected?12:10}px;font-weight:700;border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,0.25);transform:rotate(-45deg)"><span style="transform:rotate(45deg)">${docUser?.name?.[0]?.toUpperCase() || '+'}</span></div>`,
        iconSize: [size, size], iconAnchor: [size / 2, size], className: '',
      });

      let distStr = '';
      if (userLat && userLng) {
        const R = 6371;
        const dLat = (doc.locationLat - userLat) * Math.PI / 180;
        const dLng = (doc.locationLng - userLng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(userLat*Math.PI/180)*Math.cos(doc.locationLat*Math.PI/180)*Math.sin(dLng/2)**2;
        const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distStr = distKm < 1
          ? `📍 ${Math.round(distKm * 1000)} m de distancia`
          : `📍 ${distKm.toFixed(1)} km de distancia`;
      }

      const gmLink = userLat && userLng
        ? `https://www.google.com/maps/dir/${userLat},${userLng}/${doc.locationLat},${doc.locationLng}`
        : `https://www.google.com/maps/search/?api=1&query=${doc.locationLat},${doc.locationLng}`;

      const popup = L.popup({ maxWidth: 240, className: 'mediconnect-popup' }).setContent(`
        <div style="font-family:sans-serif;padding:4px 2px;line-height:1.5">
          <strong style="font-size:14px;color:#1a202c">${docUser?.name}</strong><br/>
          <span style="font-size:12px;color:#1a6b5c;font-weight:600">${doc.specialization}</span><br/>
          ${doc.locationAddress ? `<span style="font-size:11px;color:#718096">📌 ${doc.locationAddress}</span><br/>` : ''}
          ${doc.hourlyRate ? `<span style="font-size:12px;color:#2d3748">💰 $${doc.hourlyRate} MXN / consulta</span><br/>` : ''}
          ${distStr ? `<span style="font-size:12px;color:#2b6cb0;font-weight:600">${distStr}</span><br/>` : ''}
          <a href="${gmLink}" target="_blank" rel="noreferrer"
            style="display:inline-block;margin-top:6px;background:#1a6b5c;color:white;padding:4px 10px;border-radius:6px;font-size:12px;text-decoration:none;font-weight:600">
            🗺️ Cómo llegar
          </a>
        </div>
      `);

      const marker = L.marker([doc.locationLat, doc.locationLng], { icon })
        .addTo(mapObj.current)
        .bindPopup(popup)
        .on('click', () => {
          onSelect(doc);
          marker.openPopup();
        });

      if (isSelected) marker.openPopup();
      docMarkers.push(marker);
      markersRef.current.push(marker);
    });

    if (docMarkers.length > 0) {
      const group = LRef.current.featureGroup(docMarkers);
      mapObj.current.fitBounds(group.getBounds().pad(0.15), { maxZoom: 14 });
    }
  }, [mapReady, doctors, selectedId, userLat, userLng, onSelect]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapRef} className={styles.map} />
      {doctors.filter(d => d.locationLat).length === 0 && (
        <div className={styles.noLocation}>
          <span>🗺️</span>
          <p>Ningún doctor tiene ubicación configurada</p>
        </div>
      )}
    </div>
  );
};

export default DoctorMap;
